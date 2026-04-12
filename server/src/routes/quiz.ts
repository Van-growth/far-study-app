import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { read as readLearned, topConcepts, topTrapPatterns } from '../lib/learnedConcepts';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const GENERATOR_MODEL = 'claude-sonnet-4-5-20250929';
const VALIDATOR_MODEL = 'claude-sonnet-4-5-20250929';
const CONCEPT_CARD_MODEL = 'claude-sonnet-4-5-20250929';
const CONCEPT_CARD_MAX_TOKENS = 3000;
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
  const { moduleId, moduleName, weakModules, recentWrongTopics, focusConcept } = req.body as {
    moduleId: string;
    moduleName: string;
    weakModules?: { id: string; label: string; accuracy: number }[];
    recentWrongTopics?: string[];
    focusConcept?: string;
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

  // Inject accumulated learned-concept metadata from analyze sessions.
  // We never have the original question text here — only keyword counts
  // and trap descriptions — so no licensing risk.
  let learnedLine = '';
  try {
    const learned = await readLearned();
    const tops = topConcepts(learned, 5);
    const traps = topTrapPatterns(learned, 5);
    if (tops.length || traps.length) {
      const parts: string[] = [];
      if (tops.length) {
        parts.push(
          `자주 등장한 개념: ${tops.map((t) => `${t.key}(${t.count}회)`).join(', ')}`,
        );
      }
      if (traps.length) {
        parts.push(`자주 틀린 패턴: ${traps.join(' / ')}`);
      }
      parts.push(
        '→ 위 개념/함정을 자연스럽게 포함하는 문제로 출제. 단, 개념 이름을 문제 stem에 직접 언급하는 건 금지 (HARD RULES 준수).',
      );
      learnedLine = '\n\nLearned student context:\n' + parts.join('\n');
    }
  } catch {
    // If learned data unavailable, fall through silently.
  }

  const focusLine = focusConcept
    ? `\n\nFocus concept: "${focusConcept}" — 이 개념을 반드시 테스트하는 문제로 생성. (stem에 직접 이름 금지는 그대로)`
    : '';

  const prompt = `You are an expert USCPA FAR exam item writer. Generate EXACTLY ONE high-quality multiple-choice question matching the actual exam's writing style.

Internal tag (for YOUR selection only — NEVER mention in the question):
- Target module: ${moduleId} — ${moduleName}${weakLine}${wrongLine}${learnedLine}${focusLine}

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
  const {
    moduleId,
    moduleName,
    question,
    options,
    correctIdx,
    selectedIdx,
    rawText,
    userAnswer,
    correctAnswer,
    topicId,
  } = req.body as {
    moduleId?: string;
    moduleName?: string;
    question?: string;
    options?: string[];
    correctIdx?: number;
    selectedIdx?: number;
    rawText?: string;
    userAnswer?: string | null;
    correctAnswer?: string | null;
    topicId?: string | null;
  };

  const isRawMode = typeof rawText === 'string' && rawText.trim().length > 0;
  if (!isRawMode) {
    if (!question || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'question and 4 options (or rawText) required' });
    }
  }

  const ALPHA = ['A', 'B', 'C', 'D'];
  const isCorrect = !isRawMode && correctIdx === selectedIdx;

  const system = `당신은 USCPA FAR 시험 튜터입니다. 방금 푼 문제에 대한 구조화된 복습 카드를 JSON으로 반환합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) type 선택 — 문제 유형에 가장 잘 맞는 하나만
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
재무제표 형태 (우선 순위 상위 — 숫자 여러 줄이 나오면 이 쪽):
- "income_statement": I/S 항목이 핵심
  · revenue recognition, gain/loss, impairment, bad debt expense, COGS/margin,
    depreciation expense, tax expense, EPS 전후, continuing vs discontinued ops
- "balance_sheet": B/S 항목이 핵심
  · DTA/DTL, receivable/allowance, inventory valuation, PP&E/accumulated dep,
    leases ROU/liability, bonds payable balance, equity accounts, classification(current/noncurrent)
- "scf": Statement of Cash Flows
  · operating/investing/financing 분류, indirect reconciliation,
    direct method line items, non-cash disclosures
- "multi_statement": 위 중 2개 이상이 서로 연결되어야 이해되는 문제
  · 예: NI → RE → CF 추적, gain/loss가 I/S와 B/S와 SCF 모두에 영향,
    deferred tax의 I/S expense + B/S 잔액 동시 질문
  · statements 배열 순서는 반드시 I/S → B/S → SCF

그 외:
- "comparison": 두 개념/처리를 대조 (operating vs finance lease, cost vs equity,
  FIFO vs LIFO, direct vs indirect, 회계정책변경 vs 추정변경)
- "timeline": 시점/순서/기간 (subsequent events type I/II, 감가상각 라이프사이클)
- "formula": 공식 한두 개로 끝나는 단일 계산 (bond interest, PV/FV, impairment test)
- "plain": 위 전부 해당하지 않을 때만

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) sections / statement / notes 채우기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
공통: headline(1문장) 필수.

재무제표 타입은 sections 대신 statement + notes 필드를 사용:
- income_statement → statement: IncomeStatementData + notes[] (옵션)
- balance_sheet    → statement: BalanceSheetData    + notes[] (옵션)
- scf              → statement: SCFData             + notes[] (옵션)
- multi_statement  → statement: { statements: [...] } + notes[] (옵션)

기존 타입은 sections를 사용:
- comparison → sections.compare(필수) + traps(1-2개 필수) + gap(옵션)
- timeline   → sections.timeline.events(필수) + traps(옵션)
- formula    → sections.calculation(필수) + traps(옵션)
- plain      → sections.markdown(필수, 200자 이내) + traps(옵션)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3) Row 공통 스키마 (statement 타입 전용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "label": string,                  // 한국어 가능, 회계 표준 라벨은 영문도 OK
  "amount": number | null,          // null = 헤더/섹션 타이틀 같이 숫자 없음
  "indent": 0 | 1 | 2,              // 들여쓰기 레벨
  "highlight": boolean,
  "highlight_color": "amber" | "blue" | "purple" | "green" | null,
  "is_total": boolean,              // true면 상단 border + bold
  "is_subtraction": boolean,        // true면 금액에 괄호 표시 ($90,000)
  "note_tag": string | null         // 짧은 태그 "a","b","c"... — notes[]와 매칭
}

highlight 사용 규칙:
- highlight=true인 행마다 반드시 note_tag 설정 + notes 배열에 같은 tag로 대응 항목 존재할 것
- note_tag 없는 highlight, highlight 없는 notes 항목 금지
- highlight는 이 문제의 "학습 포인트"만 (보통 행당 2-4개)
- color는 같은 문제 내에서 일관된 의미로 사용(예: 핵심 계산은 amber, 함정은 blue 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4) 각 statement 데이터 스키마
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IncomeStatementData:
{
  "title": "Income Statement for the Year Ended ...",
  "sections": [
    { "label": "Revenue",           "rows": [Row, ...] },
    { "label": "Operating expenses","rows": [Row, ...] },
    { "label": "Net income",        "rows": [Row, ...] }
  ]
}

BalanceSheetData:
{
  "title": "Balance Sheet as of ...",
  "assets":      { "current": [Row, ...], "noncurrent": [Row, ...] },
  "liabilities": { "current": [Row, ...], "noncurrent": [Row, ...] },
  "equity":      [Row, ...]
}

SCFData:
{
  "title": "Statement of Cash Flows for the Year Ended ...",
  "method": "indirect" | "direct",
  "sections": [
    { "label": "Operating", "rows": [Row, ...] },
    { "label": "Investing", "rows": [Row, ...] },
    { "label": "Financing", "rows": [Row, ...] }
  ]
}

MultiStatementData:
{
  "statements": [
    { "type": "income_statement", "data": IncomeStatementData } | null,
    { "type": "balance_sheet",    "data": BalanceSheetData } | null,
    { "type": "scf",              "data": SCFData } | null
  ]
}
배열 순서는 반드시 I/S → B/S → SCF. 관련 없는 statement는 null로.

Notes:
[
  { "tag": "a", "text": "한국어로 1문장 이내 설명", "color": "amber" },
  ...
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5) 기존(non-statement) 타입 sections 스키마
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- compare: { "left": {"label","rows":[...]}, "right": {"label","rows":[...]} }
  · left/right.rows 각 3-5개 bullet, 한 줄 한국어
- gap: { "label","rows":[...],"note" }
- calculation: { "steps":[...], "result" }
  · steps 2-5개, 각 "왜 그 스텝인지" 포함
  · result는 최종 답 한 줄 (단위/통화 포함)
- timeline: { "events":[{"label","detail"}] } — 2-4개
- markdown: 200자 이내, 테이블/코드블록 금지
- traps: [{"option":"B","reason":"한 문장"}] — 1-2개
  · 오답 선택지가 구체적 금액/숫자일 때는 반드시 "amount" 필드에 해당
    숫자(순수 number, 문자열 금지)를 넣고 "calculation" 배열에 그 오답을
    유도한 step-by-step 계산을 기록한다. 각 row 스키마:
      { "label": "...", "amount": 50400, "is_total"?: bool, "is_subtraction"?: bool }
    마지막 row는 is_total=true로 합계 표시, 차감 step은 is_subtraction=true.
  · 개념 오답(금액 무관)은 calculation 생략, reason 문장으로 충분.
  · 예시 — 오답이 $50,400인 경우:
    {
      "option": "C", "amount": 50400,
      "calculation": [
        { "label": "Dealer price", "amount": 51200 },
        { "label": "Transaction costs", "amount": -800, "is_subtraction": true },
        { "label": "오답 금액", "amount": 50400, "is_total": true }
      ],
      "reason": "이미 틀린 dealer price에서 거래비용까지 차감한 이중 오류"
    }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6) 언어 / 출력 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 한국어 위주. 회계 표준 라벨(Revenue, Cost of goods sold, Deferred tax asset 등)은
  영문 그대로 유지 가능
- 숫자는 순수 number로 (문자열 "$90,000" 아님). 반드시 "amount": 90000 형식
- option 이름(A/B/C/D)만 영문
- STRICT JSON ONLY. 마크다운 코드펜스/부연 설명/인사말 금지.
  { 로 시작하고 } 로 끝낼 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7) 루트 스키마
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "type": "income_statement" | "balance_sheet" | "scf" | "multi_statement" |
          "comparison" | "timeline" | "formula" | "plain",
  "headline": "...",
  "sections": { ... },          // 기존 타입만
  "statement": { ... },         // 재무제표 타입만
  "notes": [ ... ]              // 재무제표 타입에서 highlight가 있을 때
}

불필요한 필드는 아예 생략(빈 객체/빈 배열보다 삭제가 낫다).`;

  const userMsg = isRawMode
    ? `사용자가 분석 요청한 문제 원문${topicId ? ` (현재 모듈: ${topicId})` : ''}:

${rawText!.trim()}
${userAnswer != null ? `\n사용자 답: ${userAnswer}` : ''}${correctAnswer != null ? `\n정답: ${correctAnswer}` : ''}

위 문제를 분석해서 구조화 개념 카드를 스키마대로 반환해줘. 선택지가 텍스트에 포함되어 있으면 그대로 해석하고, 없으면 핵심 개념 중심으로 작성.`
    : `모듈: ${moduleId} · ${moduleName}

문제: ${question}

선택지:
${options!.map((o, i) => `${ALPHA[i]}. ${o}`).join('\n')}

정답: ${ALPHA[correctIdx!]} · 내가 선택한 답: ${ALPHA[selectedIdx!]} ${isCorrect ? '✅' : '❌'}

위 문제에 대한 구조화 개념 카드를 스키마대로 반환해줘.`;

  const ALLOWED_TYPES = new Set([
    'comparison',
    'timeline',
    'formula',
    'plain',
    'income_statement',
    'balance_sheet',
    'scf',
    'multi_statement',
  ]);

  try {
    const msg = await anthropic.messages.create({
      model: CONCEPT_CARD_MODEL,
      max_tokens: CONCEPT_CARD_MAX_TOKENS,
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
      statement?: unknown;
      notes?: unknown;
    };
    const type = card.type && ALLOWED_TYPES.has(card.type) ? card.type : 'plain';
    return res.json({
      type,
      headline: typeof card.headline === 'string' ? card.headline : '',
      sections: card.sections && typeof card.sections === 'object' ? card.sections : {},
      statement: card.statement && typeof card.statement === 'object' ? card.statement : undefined,
      notes: Array.isArray(card.notes) ? card.notes : undefined,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
