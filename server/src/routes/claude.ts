import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';
const MODEL_SONNET5 = 'claude-sonnet-5';

// Static Harry system prompt (STEP 0~4 지침) — server/prompts/에서 관리되는 SSOT.
// 파일 수정 시 재배포만으로 자동 반영. 요청마다 바뀌지 않으므로 prompt caching 대상.
const HARRY_SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../prompts/harry-system-prompt.md'),
  'utf-8',
);
// Sonnet5 추론 모드 전용 톤 레이어 — STEP 0~4 풀이 자체엔 영향 없음, 격려/마무리 멘트에만 참고.
const USER_TONE_PREFERENCE = fs.readFileSync(
  path.join(__dirname, '../../prompts/harry-user-tone-preference.md'),
  'utf-8',
);

/**
 * POST /api/claude/chat — SSE streaming
 * body: { messages, dynamicContext, currentTopic, filterMode, matchedCards, mode }
 * mode: 'haiku'(문제풀이, 기본값) | 'sonnet5'(추론/심화)
 *
 * system은 두 블록으로 분리:
 *  1) 정적 지침(HARRY_SYSTEM_PROMPT) — cache_control 적용, 매 요청 동일 → 캐시 재사용
 *  2) 동적 컨텍스트(dynamicContext) — SSOT 카드/DB통계/문제내용 등 요청마다 변경 → 캐시 미적용
 */
router.post('/chat', async (req: Request, res: Response) => {
  const { messages, dynamicContext, currentTopic, filterMode, matchedCards, mode } = req.body as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    dynamicContext?: string;
    currentTopic?: string;
    filterMode?: string;
    matchedCards?: number;
    mode?: 'haiku' | 'sonnet5';
  };

  if (!messages?.length) {
    return res.status(400).json({ error: 'messages required' });
  }

  const isSonnet = mode === 'sonnet5';
  const model = isSonnet ? MODEL_SONNET5 : MODEL_HAIKU;

  const dynamicBlock = (dynamicContext ?? '') +
    (currentTopic ? `\n\n현재 학습 중인 토픽: ${currentTopic}` : '') +
    (isSonnet
      ? `\n\n---\n[사용자 톤 프리퍼런스 — 격려/학습전략 조언/복습 마무리 멘트에서만 참고할 것. STEP 0~4 풀이 자체는 이 톤과 무관하게 건조하고 구조적으로 유지]\n${USER_TONE_PREFERENCE}`
      : '');

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable reverse-proxy buffering so chunks reach the client immediately.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': ping\n\n');

  // ── System prompt size logging ────────────────────────────────
  const staticChars = HARRY_SYSTEM_PROMPT.length;
  const dynamicChars = dynamicBlock.length;
  const hasTBS = dynamicBlock.includes('[TBS:');
  console.log(`[harry] model=${model} static_chars=${staticChars}(cached) dynamic_chars=${dynamicChars} msgs=${messages.length} tbs=${hasTBS} filterMode=${filterMode ?? 'none'} matchedCards=${matchedCards ?? 0}`);

  try {
    const stream = anthropic.beta.promptCaching.messages.stream({
      model,
      max_tokens: 4000,
      system: [
        { type: 'text' as const, text: HARRY_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } },
        ...(dynamicBlock ? [{ type: 'text' as const, text: dynamicBlock }] : []),
      ],
      messages,
    });

    stream.on('text', (text: string) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err: Error) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    await stream.finalMessage();
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

/**
 * POST /api/claude/feynman — regular JSON (no streaming)
 * body: { text, topic, feynmanPrompt }
 */
router.post('/feynman', async (req: Request, res: Response) => {
  const { text, topic, feynmanPrompt } = req.body as {
    text: string;
    topic: string;
    feynmanPrompt?: string;
  };

  if (!text || !topic) {
    return res.status(400).json({ error: 'text and topic are required' });
  }

  const system = `You are a USCPA FAR exam tutor. The student is using the Feynman Technique to explain: "${topic}".
Evaluate their explanation in Korean.
Structure your response EXACTLY as:
1. 잘 설명한 부분 (1-2줄)
2. 놓친 핵심 개념 (bullet points with •)
3. 시험에서 꼭 기억할 한 줄 (wrap in **bold**)
Terminology: "Book value/Book basis" = "장부가액/장부기준" (NEVER "책"/"책상"). Prefer "Book value(장부가액)" format.
Be concise and exam-focused. Respond only in Korean.`;

  try {
    const message = await anthropic.beta.promptCaching.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 4000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `[토픽] ${topic}\n[프롬프트] ${feynmanPrompt ?? ''}\n\n[내 설명]\n${text}`,
        },
      ],
    });

    const feedback =
      message.content[0]?.type === 'text' ? message.content[0].text : '';
    return res.json({ feedback });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/claude/card-hint — formula or numeric example for flashcard
 * body: { concepts, auto_rules, trap_pattern }
 */
router.post('/card-hint', async (req: Request, res: Response) => {
  const { concepts, auto_rules, trap_pattern } = req.body as {
    concepts: string[];
    auto_rules: string[];
    trap_pattern?: string;
  };

  if (!auto_rules?.length && !concepts?.length) {
    return res.status(400).json({ error: 'auto_rules or concepts required' });
  }

  const system = `You are a USCPA FAR exam tutor generating a compact memory aid for a flashcard.

Rules:
1. Look at the auto_rules. If ANY auto_rule contains a mathematical formula (has "=", "×", "÷", "+/-" with variables), extract the clearest formula and output EXACTLY:
   公式: <formula text>
   예시: <one numeric example showing the formula, e.g. "초과이익 $100, Rate 10% → Bonus = $9.09">
2. If NO auto_rule has a formula, generate ONE short numeric example applying the main concept:
   예시: <one numeric example, concrete numbers, max 20 words>
3. Output ONLY the 1-2 lines above. No explanation. No intro. Korean OK.`;

  const userMsg = [
    concepts.length ? `개념: ${concepts.join(', ')}` : '',
    auto_rules.length ? `auto_rules:\n${auto_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : '',
    trap_pattern ? `함정 패턴: ${trap_pattern}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    const message = await anthropic.beta.promptCaching.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 150,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });

    const hint = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    return res.json({ hint });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

export default router;
