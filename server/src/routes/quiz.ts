import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { read as readLearned, topConcepts, topTrapPatterns } from '../lib/learnedConcepts';
import { fetchConceptExtractions, buildExtractionContext } from '../lib/supabase';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5-20250929';
const CONCEPT_CARD_MODEL = 'claude-sonnet-4-5-20250929';
const CONCEPT_CARD_MAX_TOKENS = 3000;
const MAX_RETRIES = 2; // 로컬 체크 실패 시 재시도 (최대 3회 시도)

interface CalculationStep {
  label: string;
  amount: number;
  is_subtraction?: boolean;
  is_total?: boolean;
}

interface GeneratedMcq {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
  calculation_steps: CalculationStep[] | null;
  raw_answer: number | null;
}

// ─────────────────────────────────────────────────────────────
// localPostCheck — API 호출 없이 즉시 검증
// approx 표현 감지 + raw_answer 보기 매칭
// ─────────────────────────────────────────────────────────────
function localPostCheck(item: GeneratedMcq): { pass: boolean; reason: string | null } {
  // 1. "approximately" / "closest to" 표현 감지
  const approxPattern = /approximately|closest to|nearest to|about \$|roughly/i;
  if (approxPattern.test(item.q) || approxPattern.test(item.exp)) {
    return {
      pass: false,
      reason: '"approximately" / "closest to" 표현 감지 — 정답이 보기에 정확히 없을 가능성',
    };
  }

  // 2. 계산형: raw_answer가 보기에 정확히 존재하는지 확인
  if (item.calculation_steps !== null && item.raw_answer !== null) {
    const rawStr = String(item.raw_answer);
    const exactMatch = item.opts.some((opt) => {
      const cleaned = opt.replace(/[$,()]/g, '').trim();
      return cleaned === rawStr || cleaned === `-${rawStr}`;
    });
    if (!exactMatch) {
      return {
        pass: false,
        reason: `raw_answer(${item.raw_answer})가 보기 4개에 정확히 존재하지 않음`,
      };
    }
  }

  return { pass: true, reason: null };
}

// ─────────────────────────────────────────────────────────────
// POST /api/generate-question
//
// 단일 에이전트 구조: 생성 → 자기검증 → 최종 JSON
// concept_extractions 기반 출제 (fallback: learnedConcepts)
// ─────────────────────────────────────────────────────────────
router.post('/generate-question', async (req: Request, res: Response) => {
  const { moduleId, moduleName, weakModules, recentWrongTopics, focusConcept } =
    req.body as {
      moduleId: string;
      moduleName: string;
      weakModules?: { id: string; label: string; accuracy: number }[];
      recentWrongTopics?: string[];
      focusConcept?: string;
    };

  if (!moduleId || !moduleName) {
    return res.status(400).json({ error: 'moduleId and moduleName required' });
  }

  // ── 약점 정보 ──────────────────────────────────────────────
  const weakLine = weakModules?.length
    ? `\nStudent's currently weak modules (accuracy <60%): ${weakModules
        .slice(0, 6)
        .map((w) => `${w.id} ${w.label} (${w.accuracy}%)`)
        .join(', ')}.`
    : '';
  const wrongLine = recentWrongTopics?.length
    ? `\nRecent wrong topics: ${recentWrongTopics.slice(0, 8).join(', ')}.`
    : '';

  // ── concept_extractions 기반 출제 컨텍스트 ─────────────────
  let studentContext = '';

  // 1차: Supabase concept_extractions
  const extractions = await fetchConceptExtractions(moduleId);
  const extractionCtx = buildExtractionContext(extractions);

  if (extractionCtx) {
    studentContext = '\n\nStudent learning data (concept_extractions):\n' + extractionCtx;
  } else {
    // 2차 fallback: learnedConcepts (파일 기반)
    try {
      const learned = await readLearned();
      const tops = topConcepts(learned, 5);
      const traps = topTrapPatterns(learned, 5);
      if (tops.length || traps.length) {
        const parts: string[] = [];
        if (tops.length) {
          parts.push(`자주 틀린 개념: ${tops.map((t) => `${t.key}(${t.count}회)`).join(', ')}`);
        }
        if (traps.length) {
          parts.push(`자주 걸리는 함정: ${traps.join(' / ')}`);
        }
        parts.push('위 개념/함정을 의도적으로 포함하는 문제로 출제. 단, 개념 이름은 문제 stem에 직접 언급하는 것 금지.');
        studentContext = '\n\nLearned student context (fallback):\n' + parts.join('\n');
      }
    } catch {
      // fall through
    }
  }

  const focusLine = focusConcept
    ? `\n\nFocus concept: "${focusConcept}" — 이 개념을 반드시 포함하는 문제로 출제. (stem에 직접 언급 금지, 시나리오로)`
    : '';

  // ── 단일 에이전트 프롬프트 ─────────────────────────────────
  const prompt = `You are an expert USCPA FAR exam item writer. Generate and self-verify EXACTLY ONE high-quality MCQ.

Internal tag (NEVER mention in the question):
- Target module: ${moduleId} — ${moduleName}${weakLine}${wrongLine}${studentContext}${focusLine}

━━━ HARD RULES — stem & options ━━━

FORBIDDEN:
- ASC / ASU / GASB / SFAS codification numbers in stem or options
- Topic/module names (Inventory, Leases, Revenue Recognition, etc.)
- Parenthetical hints like "(Inventory)" or "(Lease Accounting)"
- Hint-y prefaces: "Under GAAP...", "Under U.S. GAAP...", "Per the standards..."
- "approximately", "closest to", "nearest to", "about $", "roughly" — NEVER use these
  (Every option must be a precise, exact number. The correct answer MUST appear exactly in the options.)

REQUIRED:
- Pure business scenario: company, person, or transaction
- Concrete numbers, dates, terms ($, %, shares, years, FOB terms)
- Crisp terminal question: "What amount should be recorded?" / "How should this be reported?" / "What is the gain or loss?"
- Exactly 4 options
- At least 2 plausible trap distractors

━━━ CALCULATION DISCIPLINE (핵심: 계산은 여기서 1번만) ━━━

If this is a computational question (involves $, %, rates, periods, depreciation, PV/FV, etc.):
1. Solve the problem yourself FIRST, step by step
2. Write down each step as a calculation_steps entry
3. The final step's amount = raw_answer
4. Place raw_answer EXACTLY as one of the 4 options (no rounding, no approximation)
5. Set ans to the index (0-3) of that exact option
6. Write exp by RESTATING calculation_steps in natural Korean — do NOT redo the math independently.
   exp must be consistent with calculation_steps. If they disagree, the question is broken.

If this is a pure conceptual question (no arithmetic needed):
- Set calculation_steps to null
- Set raw_answer to null

━━━ SELF-VERIFICATION (출력 전 반드시 수행) ━━━

문제를 만든 뒤 아래를 점검하라:
1. raw_answer가 opts 4개 중 하나와 정확히 일치하는가?
2. calculation_steps의 각 단계가 논리적으로 올바른가?
3. "approximately"/"closest to"/"nearest to" 표현이 어디에도 없는가?
4. GAAP 기준으로 정답이 분명히 하나뿐인가?
5. exp가 calculation_steps와 일치하는가?

하나라도 실패하면 처음부터 다시 만들어라.
검증 통과한 최종 문제만 JSON으로 출력.

━━━ OUTPUT SCHEMA ━━━

Return STRICT JSON ONLY. No prose, no markdown fences, no self-verification commentary.

{
  "q": "Question text — pure business scenario, no standard numbers, no topic names",
  "opts": ["Option A", "Option B", "Option C", "Option D"],
  "ans": 0,
  "exp": "Korean explanation — calculation_steps를 그대로 인용하여 작성. 새로 계산하지 않음. WHY correct answer is right AND why each wrong option is wrong. MAY cite ASC/GAAP here.",
  "calculation_steps": [
    { "label": "설명", "amount": 100000 },
    { "label": "차감 항목", "amount": -20000, "is_subtraction": true },
    { "label": "최종 결과", "amount": 80000, "is_total": true }
  ],
  "raw_answer": 80000
}

For conceptual questions:
  "calculation_steps": null,
  "raw_answer": null

Korean terminology rule for exp:
- "Book value" / "Book basis" = "장부가액" / "장부기준". NEVER translate Book as "책" or "책상".
- Prefer "Book value(장부가액)" format (English + parenthetical Korean).
- Tax vs Book: "Tax(세무)상" vs "Book(장부/GAAP)상"

"ans" is 0-based index. Start with { end with }.`;

  function parseResponse(text: string): GeneratedMcq | { error: string } {
    try {
      const trimmed = text.trim();
      const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      const body = fenced ? fenced[1] : trimmed;
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
        calculation_steps: Array.isArray(parsed.calculation_steps)
          ? parsed.calculation_steps
          : null,
        raw_answer: typeof parsed.raw_answer === 'number' ? parsed.raw_answer : null,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'parse error' };
    }
  }

  try {
    let lastReason: string | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const fullPrompt = lastReason
        ? `${prompt}\n\nADDITIONAL CONSTRAINT (previous attempt rejected):\n${lastReason}\nProduce a fresh, correct question avoiding the same issue.`
        : prompt;

      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: fullPrompt }],
      });

      const block = msg.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text') {
        lastReason = 'no text in response';
        if (attempt === MAX_RETRIES) {
          return res.status(502).json({ error: 'no text in response' });
        }
        continue;
      }

      const result = parseResponse(block.text);
      if ('error' in result) {
        lastReason = `invalid output: ${result.error}`;
        if (attempt === MAX_RETRIES) {
          return res.status(502).json({ error: result.error });
        }
        continue;
      }

      // 로컬 체크
      const check = localPostCheck(result);
      if (!check.pass) {
        console.log(
          `[generate] retry ${attempt + 1}/${MAX_RETRIES} — local check failed: ${check.reason}`,
        );
        lastReason = check.reason ?? 'local check failed';
        if (attempt === MAX_RETRIES) {
          // 마지막 시도는 경고와 함께 반환
          return res.json({
            q: result.q,
            opts: result.opts,
            ans: result.ans,
            exp: result.exp,
            calculation_steps: result.calculation_steps,
            confidence: 'low' as const,
            warning: check.reason,
          });
        }
        continue;
      }

      // 성공
      if (attempt > 0) {
        console.log(`[generate] accepted on attempt ${attempt + 1}`);
      }
      return res.json({
        q: result.q,
        opts: result.opts,
        ans: result.ans,
        exp: result.exp,
        calculation_steps: result.calculation_steps,
        confidence: 'high' as const,
        warning: null,
      });
    }

    return res.status(500).json({ error: 'unexpected loop exit' });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/concept-card
// (변경 없음 — 기존 코드 유지)
// ─────────────────────────────────────────────────────────────
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

  const system = `당신은 USCPA FAR 시험 전문가입니다. 풀었던 문제를 바탕으로 핵심 개념 카드를 JSON으로 반환합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) type 선택 — 문제 성격에 맞는 타입을 고르세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
재무제표 타입 (계정 항목, 금액, 분류가 핵심이면 사용):
- "income_statement": I/S 관련 문제
- "balance_sheet": B/S 관련 문제
- "scf": Statement of Cash Flows
- "multi_statement": 2개 이상 재무제표에 걸친 문제

그외:
- "comparison": 두 개념/처리를 비교 (operating vs finance lease, FIFO vs LIFO 등)
- "timeline": 시점/기간/이벤트 (subsequent events, 이자 자본화 등)
- "formula": 계산 공식 위주 (bond interest, PV/FV, impairment test)
- "plain": 위 어디에도 해당하지 않을 때

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) sections / statement / notes 작성하기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
공통: headline(1문장) 필수.

재무제표 타입은 sections 대신 statement + notes 사용:
- income_statement → statement: IncomeStatementData + notes[] (선택)
- balance_sheet    → statement: BalanceSheetData    + notes[] (선택)
- scf              → statement: SCFData             + notes[] (선택)
- multi_statement  → statement: { statements: [...] } + notes[] (선택)

그외 타입은 sections 사용:
- comparison → sections.compare(필수) + traps(1-2개 필수) + gap(선택)
- timeline   → sections.timeline.events(필수) + traps(선택)
- formula    → sections.calculation(필수) + traps(선택)
- plain      → sections.markdown(필수, 200자 이하) + traps(선택)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3) Row 기본 구조 (statement 타입에만 적용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "label": string,
  "amount": number | null,
  "indent": 0 | 1 | 2,
  "highlight": boolean,
  "highlight_color": "amber" | "blue" | "purple" | "green" | null,
  "is_total": boolean,
  "is_subtraction": boolean,
  "note_tag": string | null
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4) 각 statement 데이터 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IncomeStatementData:
{
  "title": "Income Statement for the Year Ended ...",
  "sections": [
    { "label": "Revenue",            "rows": [Row, ...] },
    { "label": "Operating expenses", "rows": [Row, ...] },
    { "label": "Net income",         "rows": [Row, ...] }
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
    { "label": "Investing",  "rows": [Row, ...] },
    { "label": "Financing",  "rows": [Row, ...] }
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
순서: 반드시 I/S → B/S → SCF. 불필요한 statement는 null로.

Notes:
[
  { "tag": "a", "text": "짧게 1문장 이내 설명", "color": "amber" },
  ...
]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5) 그외(non-statement) sections 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- compare: { "left": {"label","rows":[...]}, "right": {"label","rows":[...]} }
- gap: { "label","rows":[...],"note" }
- calculation: { "steps":[...], "result" }
- timeline: { "events":[{"label","detail"}] }
- markdown: 200자 이하 텍스트
- traps: [{"option":"B","reason":"한 문장"}] 1-2개
  ※ 오답 보기가 숫자를 포함하면 "amount" 필드 추가:
    { "option": "C", "amount": 50400,
      "calculation": [
        { "label": "Dealer price", "amount": 51200 },
        { "label": "Transaction costs", "amount": -800, "is_subtraction": true },
        { "label": "오답 결과", "amount": 50400, "is_total": true }
      ],
      "reason": "왜 틀린지 한 문장"
    }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6) 언어 / 숫자 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 한국어로. 계정과목(Revenue, Cost of goods sold 등)은 영어 그대로.
- 숫자는 number 타입으로 ($90,000 → 90000)
- option 알파벳(A/B/C/D)만 표기
- STRICT JSON ONLY. 마크다운/설명 없이 { 로 시작해서 } 로 끝낼 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7) 최종 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "type": "income_statement" | "balance_sheet" | "scf" | "multi_statement" |
          "comparison" | "timeline" | "formula" | "plain",
  "headline": "...",
  "sections": { ... },
  "statement": { ... },
  "notes": [ ... ]
}`;

  const userMsg = isRawMode
    ? `사용자가 방금 풀었던 문제 원문${topicId ? ` (현재 모듈: ${topicId})` : ''}:

${rawText!.trim()}
${userAnswer != null ? `\n사용자 답: ${userAnswer}` : ''}${correctAnswer != null ? `\n정답: ${correctAnswer}` : ''}

이 문제를 바탕으로 핵심 개념 카드를 스키마대로 반환해주세요. 보기가 텍스트에 포함되어 있으면 그대로 활용하고, 없으면 기본 개념 위주로 작성.`
    : `모듈: ${moduleId} · ${moduleName}

문제: ${question}

보기:
${options!.map((o, i) => `${ALPHA[i]}. ${o}`).join('\n')}

정답: ${ALPHA[correctIdx!]} · 내가 선택한 답: ${ALPHA[selectedIdx!]} ${isCorrect ? '✓' : '✗'}

이 문제를 바탕으로 핵심 개념 카드를 스키마대로 반환해주세요.`;

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
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let body = fenced ? fenced[1] : text;
    const first = body.indexOf('{');
    const last = body.lastIndexOf('}');
    if (first !== -1 && last > first) {
      body = body.slice(first, last + 1);
    }
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
