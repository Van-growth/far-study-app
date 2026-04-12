import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const GENERATOR_MODEL = 'claude-sonnet-4-5-20250929';
const VALIDATOR_MODEL = 'claude-sonnet-4-5-20250929';
const CONCEPT_CARD_MODEL = 'claude-haiku-4-5-20251001';
const MAX_VALIDATION_RETRIES = 2;

interface GeneratedMcq {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

// ── Validate a generated question with a second model pass ────
// Returns null if valid, or a rejection reason string.
async function validateQuestion(item: GeneratedMcq): Promise<string | null> {
  const ALPHA = ['A', 'B', 'C', 'D'];
  const review = `아래 FAR 시험 MCQ 문제와 정답이 회계 원칙상 정확한지 검토해줘.

문제: ${item.q}

선택지:
${item.opts.map((o, i) => `${ALPHA[i]}. ${o}`).join('\n')}

출제자 정답: ${ALPHA[item.ans]} (${item.opts[item.ans]})

해설: ${item.exp}

검토 기준:
- 정답(ans로 표시된 선택지)이 US GAAP / FASB ASC / GASB 기준으로 실제로 정확한가?
- 다른 선택지가 "우연히도" 더 정확한 답은 아닌가?
- 계산 문제라면 산술이 맞는가?
- 해설이 정답을 실제로 뒷받침하는가 (모순 없음)?
- 문제 자체가 ambiguous하거나 복수 정답이 가능한 경우 valid=false

반환 형식 — STRICT JSON 만. 부연 설명 금지, 마크다운 코드 펜스 금지:

정답이 맞고 문제에 문제가 없으면:
{"valid": true}

정답이 틀렸거나 문제에 결함이 있으면:
{"valid": false, "reason": "한국어로 한 줄 사유"}

{ 로 시작하고 } 로 끝내.`;

  try {
    const msg = await anthropic.messages.create({
      model: VALIDATOR_MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: review }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return 'no validator response';
    const text = block.text.trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    const body = fenced ? fenced[1] : text;
    const parsed = JSON.parse(body) as { valid?: boolean; reason?: string };
    if (parsed.valid === true) return null;
    return parsed.reason ?? 'validator rejected without reason';
  } catch (e) {
    // Don't fail the whole pipeline if validator misbehaves — accept the original item.
    console.warn('[validate] failed, accepting item:', e instanceof Error ? e.message : e);
    return null;
  }
}

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

  const prompt = `You are an expert USCPA FAR exam item writer. Generate EXACTLY ONE high-quality multiple-choice question matching the actual exam's writing style.

Internal tag (for YOUR selection only — NEVER mention in the question):
- Target module: ${moduleId} — ${moduleName}${weakLine}${wrongLine}

HARD RULES — style of the stem (question body):

FORBIDDEN in the question stem and options:
- DO NOT reference ASC / ASU / GASB / SFAS codification numbers (no "ASC 330", "ASC 606", "ASC 842", "GASB 34", etc.)
- DO NOT name the topic or module (no "Inventory", "Leases", "Revenue Recognition", "Business Combinations", etc.)
- DO NOT use parenthetical topic hints like "(Inventory)" or "(Lease Accounting)"
- DO NOT use hint-y prefaces like "Under GAAP...", "Under U.S. GAAP...", "Per the standards..."
- DO NOT label the question with its area/module

REQUIRED style of the stem:
- Pure business scenario centered on a company, person, or transaction
- Concrete numbers, dates, terms (e.g., $, %, shares, years, FOB terms)
- Crisp terminal question like: "What amount should be recorded?" / "How should this be reported?" / "What is the gain or loss?" / "What amount, if any, should be recognized?"
- Let the student infer which concept is being tested purely from the facts

BAD (never do this):
  "Under ASC 330 (Inventory), what amount..."
  "Per ASC 842 for leases, how should the lessee..."
  "Under U.S. GAAP, when does a company recognize revenue..."

GOOD (do this):
  "A company purchased goods for $50,000 with FOB shipping point terms. The goods were in transit at year-end. What amount should be included in the company's year-end balance?"
  "On January 1, Year 1, Alpha Co. signed a 5-year noncancelable agreement to use equipment with annual payments of $20,000 due each December 31. The implicit rate is 6%. What amount should Alpha record as a liability on January 1, Year 1?"

Other requirements:
- One question, exactly 4 options
- Mix computational and conceptual across calls (vary style each time)
- At least 2 plausible trap distractors with realistic wrong-number rationale
- Question and all 4 options written in English, USCPA exam tone
- Explanation ("exp") in Korean: explain WHY the correct answer is correct AND why each wrong option is wrong
- In the EXPLANATION you MAY reference ASC/GASB codification and the underlying concept for teaching purposes — the forbidden words only apply to the question stem and options

Return STRICT JSON ONLY. No prose, no markdown fences. Schema:

{
  "q": "Question text in English — pure business scenario, no standard numbers, no topic names",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans": 0,
  "exp": "Korean explanation — may cite ASC/GASB and concepts here"
}

"ans" is the 0-based index (0=A, 1=B, 2=C, 3=D). Start response with { and end with }.`;

  async function generateOnce(extraSystemNote?: string): Promise<GeneratedMcq | { error: string }> {
    const fullPrompt = extraSystemNote
      ? `${prompt}\n\nADDITIONAL CONSTRAINT (previous attempt rejected):\n${extraSystemNote}\nAvoid the exact issue above. Produce a fresh, correct question.`
      : prompt;
    try {
      const msg = await anthropic.messages.create({
        model: GENERATOR_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }],
      });
      const block = msg.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text') return { error: 'no text in response' };
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
        return { error: 'invalid question shape' };
      }
      return {
        q: parsed.q.trim(),
        opts: parsed.opts.map((o: unknown) => String(o)),
        ans: parsed.ans,
        exp: parsed.exp.trim(),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'generator error' };
    }
  }

  try {
    let lastReason: string | undefined;
    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const result = await generateOnce(lastReason);
      if ('error' in result) {
        // Shape / network error — retry until budget runs out.
        lastReason = `previous attempt produced invalid output: ${result.error}`;
        if (attempt === MAX_VALIDATION_RETRIES) {
          return res.status(502).json({ error: result.error });
        }
        continue;
      }

      const rejection = await validateQuestion(result);
      if (rejection === null) {
        if (attempt > 0) console.log(`[generate] accepted on retry ${attempt}`);
        return res.json(result);
      }
      console.log(`[generate] retry ${attempt + 1}/${MAX_VALIDATION_RETRIES} — ${rejection}`);
      lastReason = rejection;
    }
    // Ran out of retries — return the last generated item anyway rather than 500.
    // (Validator may be overly strict; a best-effort item is better than nothing.)
    const fallback = await generateOnce(lastReason);
    if ('error' in fallback) {
      return res.status(502).json({ error: fallback.error });
    }
    return res.json(fallback);
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
      model: CONCEPT_CARD_MODEL,
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
