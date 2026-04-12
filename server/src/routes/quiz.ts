import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

// ─────────────────────────────────────────────
// POST /api/generate-question
// body: { moduleId, moduleName, weakModules?, recentWrongTopics? }
// returns: { q, opts: [a,b,c,d], ans: 0-3, exp }
// ─────────────────────────────────────────────
router.post('/generate-question', async (req: Request, res: Response) => {
  const { moduleId, moduleName, weakModules, recentWrongTopics } = req.body as {
    moduleId: string;
    moduleName: string;
    weakModules?: { id: string; label: string; accuracy: number }[];
    recentWrongTopics?: string[];
  };

  if (!moduleId || !moduleName) {
    return res.status(400).json({ error: 'moduleId and moduleName required' });
  }

  const weakLine = weakModules?.length
    ? `\nStudent's currently weak modules (accuracy <60%): ${weakModules
        .slice(0, 6)
        .map((w) => `${w.id} ${w.label} (${w.accuracy}%)`)
        .join(', ')}.`
    : '';
  const wrongLine = recentWrongTopics?.length
    ? `\nRecent wrong topics: ${recentWrongTopics.slice(0, 8).join(', ')}.`
    : '';

  const prompt = `You are an expert USCPA FAR exam item writer. Generate EXACTLY ONE high-quality multiple-choice question for this Becker module:

Target module: ${moduleId} — ${moduleName}${weakLine}${wrongLine}

Requirements:
- One question, 4 options
- Mix computational and conceptual across calls (vary style)
- At least 2 plausible trap distractors
- Question + options in English (USCPA exam style)
- Explanation in Korean, explain WHY correct is correct AND why wrong options are wrong
- Use realistic $, %, shares, years when applicable
- Cite ASC/GASB briefly when relevant

Return STRICT JSON ONLY. No prose, no markdown fences. Schema:

{
  "q": "Question text in English",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans": 0,
  "exp": "Korean explanation"
}

"ans" is the 0-based index (0=A, 1=B, 2=C, 3=D). Start response with { and end with }.`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return res.status(502).json({ error: 'no text in response' });
    }
    const text = block.text.trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    const body = fenced ? fenced[1] : text;
    const parsed = JSON.parse(body);

    if (
      typeof parsed.q !== 'string' ||
      !Array.isArray(parsed.opts) ||
      parsed.opts.length !== 4 ||
      typeof parsed.ans !== 'number' ||
      parsed.ans < 0 ||
      parsed.ans > 3 ||
      typeof parsed.exp !== 'string'
    ) {
      return res.status(502).json({ error: 'invalid question shape' });
    }

    return res.json({
      q: parsed.q.trim(),
      opts: parsed.opts.map((o: unknown) => String(o)),
      ans: parsed.ans,
      exp: parsed.exp.trim(),
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// ─────────────────────────────────────────────
// POST /api/concept-card — SSE streaming concept card after an answer
// body: { moduleId, moduleName, question, options, correctIdx, selectedIdx }
// ─────────────────────────────────────────────
router.post('/concept-card', async (req: Request, res: Response) => {
  const { moduleId, moduleName, question, options, correctIdx, selectedIdx } =
    req.body as {
      moduleId: string;
      moduleName: string;
      question: string;
      options: string[];
      correctIdx: number;
      selectedIdx: number;
    };

  if (!question || !Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: 'question and 4 options required' });
  }

  const ALPHA = ['A', 'B', 'C', 'D'];
  const isCorrect = correctIdx === selectedIdx;
  const userMsg = `모듈: ${moduleId} · ${moduleName}

문제: ${question}

선택지:
${options.map((o, i) => `${ALPHA[i]}. ${o}`).join('\n')}

정답: ${ALPHA[correctIdx]} · 내가 선택한 답: ${ALPHA[selectedIdx]} ${isCorrect ? '✅' : '❌'}

위 문제에 대한 초간결 개념 카드를 생성해줘.`;

  const system = `당신은 USCPA FAR 시험 튜터입니다. 문제 직후 복습용 "개념 카드"를 한국어로 작성합니다.

반드시 아래 4개 섹션을 순서대로 출력하고, 각 섹션은 1-2문장으로 압축:

🎯 핵심 — 이 문제의 핵심 개념 한 문장
📐 풀이 구조 — 어떻게 접근/계산해야 하는지 구조
⚠️ 함정 — 가장 유혹적인 오답이 왜 틀렸는지
🔁 트리거 — "~가 나오면 → ~한다" 조건반사 규칙

엄격한 제약:
- 전체 150단어 이내 (한국어 기준)
- 마크다운 테이블(|) 절대 금지
- 코드 블록 금지
- 불필요한 설명/인사말 금지, 바로 🎯 부터 시작
- 각 섹션은 이모지 + 공백 + 내용 형식, 줄바꿈으로 구분`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    stream.on('text', (text: string) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err: Error) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    res.write(`data: ${JSON.stringify({ error: m })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
