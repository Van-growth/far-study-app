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
// POST /api/concept-card — structured JSON concept card after an answer
// body: { moduleId, moduleName, question, options, correctIdx, selectedIdx }
// returns: ConceptCard (see client/src/hooks/useDynamicQuiz.ts)
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

  const system = `당신은 USCPA FAR 시험 튜터입니다. 방금 푼 문제에 대한 구조화된 복습 카드를 생성합니다.

반환 규칙:
1) type 선택 — 문제 유형에 가장 잘 맞는 하나만:
   - "comparison": 두 개념/금액/처리 방식을 대조해야 이해되는 문제
     (예: 이연법인세 자산 vs 부채, operating vs finance lease, cost vs equity method,
      direct vs indirect SCF, 회계정책변경 vs 추정변경, FIFO vs LIFO, gross vs net method)
   - "timeline": 시점/순서/기간에 따라 처리가 달라지는 문제
     (예: subsequent events type I/II, 감가상각 시작-중단-처분, 취득-보유-매각,
      revenue recognition over time)
   - "formula": 공식 한두 개로 결론이 나는 계산 중심 문제
     (예: bond interest, PV/FV, EPS, straight-line/DDB depreciation, impairment test)
   - "plain": 위 셋에 해당하지 않는 경우만 선택

2) sections 채우기 — type 별 요구:
   - comparison: compare(필수) + traps(1-2개 필수) + gap(옵션)
   - timeline: timeline.events(필수) + traps(옵션)
   - formula: calculation(필수) + traps(옵션)
   - plain: markdown(필수, 200자 이내) + traps(옵션)

3) headline: 이 문제의 핵심을 한국어 1문장으로. 모든 type에 필수.

4) 분량:
   - compare.left/right.rows: 각 3-5개 bullet, 각 한 줄 한국어
   - gap.rows: 1-3줄, note는 1문장
   - calculation.steps: 2-5 스텝, 각 한 줄에 "왜 그 스텝인지"까지 포함
   - calculation.result: 최종 답 한 줄(단위/통화 포함)
   - timeline.events: 2-4개, label=시점, detail=옵션 한 문장
   - markdown: 200자 이내 한국어, 테이블/코드블록 금지
   - traps[]: 1-2개. option은 선택지 레이블(A/B/C/D) 또는 숫자, reason은 한 문장

5) 언어: 모든 값 한국어. option 이름만 영문 대문자(A-D) 유지.

6) STRICT JSON ONLY. 마크다운 펜스 금지, 부연 설명 금지, 인사말 금지. { 로 시작하고 } 로 끝낼 것.

스키마 (optional 필드는 type에 맞지 않으면 아예 생략):
{
  "type": "comparison" | "timeline" | "formula" | "plain",
  "headline": "...",
  "sections": {
    "compare": { "left": {"label": "...", "rows": ["..."]}, "right": {"label": "...", "rows": ["..."]} },
    "gap": { "label": "...", "rows": ["..."], "note": "..." },
    "calculation": { "steps": ["..."], "result": "..." },
    "timeline": { "events": [{"label": "...", "detail": "..."}] },
    "markdown": "...",
    "traps": [{"option": "B", "reason": "..."}]
  }
}`;

  const userMsg = `모듈: ${moduleId} · ${moduleName}

문제: ${question}

선택지:
${options.map((o, i) => `${ALPHA[i]}. ${o}`).join('\n')}

정답: ${ALPHA[correctIdx]} · 내가 선택한 답: ${ALPHA[selectedIdx]} ${isCorrect ? '✅' : '❌'}

위 문제에 대한 구조화 개념 카드를 스키마대로 반환해줘.`;

  try {
    const msg = await anthropic.messages.create({
      model: CONCEPT_CARD_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return res.status(502).json({ error: 'no text in response' });
    }
    const text = block.text.trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    const body = fenced ? fenced[1] : text;
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      // Fallback: wrap raw text as plain card so the client still has something to show.
      console.warn('[concept-card] JSON parse failed, falling back to plain:', e instanceof Error ? e.message : e);
      return res.json({
        type: 'plain',
        headline: '개념 카드',
        sections: { markdown: text.slice(0, 400) },
      });
    }

    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'invalid card shape' });
    }
    const card = parsed as {
      type?: string;
      headline?: string;
      sections?: unknown;
    };
    const type =
      card.type === 'comparison' || card.type === 'timeline' || card.type === 'formula'
        ? card.type
        : 'plain';
    return res.json({
      type,
      headline: typeof card.headline === 'string' ? card.headline : '',
      sections: card.sections && typeof card.sections === 'object' ? card.sections : {},
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
