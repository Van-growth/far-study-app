import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import {
  applyExtraction,
  read as readLearned,
  ExtractedConcepts,
  ConceptTrigger,
} from '../lib/learnedConcepts';
import { inferTopicId } from '../lib/topicInference';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-6';
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';

// ── 복습용 예시 문제 생성 (Haiku, fire-once) ───────────────────
async function generateExampleQuestion(
  questionText: string,
  correctAnswer: string | null | undefined,
): Promise<{ question: string; options: string[]; answer: string; explanation: string } | null> {
  const prompt = `아래 Becker 문제를 복습용으로 간단화해라.
숫자와 핵심 개념은 그대로 유지. 형태만 4지선다로 재구성.

문제:
${questionText}${correctAnswer ? `\n정답: ${correctAnswer}` : ''}

규칙:
- 숫자 변경 금지
- 핵심 개념 변경 금지
- 오답 보기는 실제 시험에서 자주 나오는 trap으로 구성
- explanation은 정답 선택지 기준으로만 작성

STRICT JSON ONLY:
{
  "question": "간단화된 문제 텍스트",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "C",
  "explanation": "정답 근거 한 문장 (US GAAP 기준)"
}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const p = JSON.parse(jsonMatch[0]) as {
      question?: string;
      options?: unknown;
      answer?: string;
      explanation?: string;
    };
    if (!p.question || !Array.isArray(p.options) || !p.answer) return null;
    return {
      question: p.question,
      options: (p.options as unknown[]).map((o) => String(o)),
      answer: p.answer,
      explanation: typeof p.explanation === 'string' ? p.explanation : '',
    };
  } catch (e) {
    console.error('[analyze] generateExampleQuestion 실패:', e instanceof Error ? e.message : e);
    return null;
  }
}

// ─────────────────────────────────────────────
// POST /api/extract-concepts
// body: { questionText, userAnswer?, correctAnswer?, topicId? }
// Anthropic 호출 → 200 + extracted 즉시 반환.
// 파일 저장(applyExtraction)만 fire-and-forget.
// ─────────────────────────────────────────────
router.post('/extract-concepts', async (req: Request, res: Response) => {
  console.log('[analyze] extract-concepts 요청 받음');

  const finish = (status: number, body: object) => {
    if (res.headersSent) {
      console.warn('[analyze] finish() 무시 — 헤더 이미 전송됨');
      return;
    }
    res.status(status).json(body);
  };

  const { questionText, userAnswer, correctAnswer, topicId } = req.body as {
    questionText?: string;
    userAnswer?: string | null;
    correctAnswer?: string | null;
    topicId?: string | null;
  };
  if (!questionText || typeof questionText !== 'string') {
    finish(400, { error: 'questionText required' });
    return;
  }

  const cleanedText = questionText
    .trim()
    .replace(/\n{3,}/g, '\n\n');

  const wasWrong = userAnswer && correctAnswer && userAnswer !== correctAnswer;
  const answerLine =
    userAnswer != null && correctAnswer != null
      ? `\n사용자 답: ${userAnswer}\n정답: ${correctAnswer}\n${wasWrong ? '→ 오답' : '→ 정답'}`
      : '';
  const topicLine = topicId ? `\n현재 모듈: ${topicId}` : '';

  // 개념 추출과 병렬 실행 — 실패해도 응답 차단 안 함
  const exampleQuestionPromise = generateExampleQuestion(cleanedText, correctAnswer);

  const prompt = `아래 FAR 문제 원문에서 학습 데이터로 재사용할 개념 메타데이터만 추출하세요.
${topicLine}

문제 원문:
${cleanedText}${answerLine}

반환 규칙:
- concepts: 이 문제의 핵심 회계 개념/키워드 (한국어 또는 영문 그대로). 예: "DTA", "DTL", "손상차손", "일시적 차이"
- asc_references: 관련 ASC/ASU/GASB 코드 (예: "ASC 740", "ASC 360"). 불분명하면 빈 배열
- topic_tags: 영문 snake_case 태그 (예: "deferred_tax", "impairment", "balance_sheet")
- trap_pattern: 오답일 때만 — 사용자가 흔히 빠지는 개념적 함정 한 문장 (예: "DTA와 DTL 방향 혼동"). 정답이거나 판단 불가면 null
- triggers: 문제에서 핵심 키워드를 감지하고 각 키워드에 대해 자동 반응 규칙을 정의. 문제당 1~3개. 없으면 빈 배열 [].
  각 trigger 필드:
  - keyword: 문제에서 감지한 핵심 단어/구문 (예: "cumulative preferred")
  - auto_rule: 이 키워드 보면 자동으로 취해야 할 행동 (예: "무조건 EPS 분자에서 차감 (선언 여부 무관)")
  - trap: 가장 많이 틀리는 오해/함정 (예: "not declared여도 차감 — 선언 여부는 무관")
  - comparison: 헷갈리는 유사 개념과 비교 (예: "noncumulative는 선언된 것만 차감")
  - irrelevant: 문제에서 무시해도 되는 데이터 (예: "배당 선언 여부")

절대 문제 원문의 숫자/인물명/회사명/구체적 시나리오를 복사하지 마세요. 개념 키워드와 패턴만.

STRICT JSON ONLY. 마크다운 펜스/부연 설명 금지. { 로 시작하고 } 로 끝낼 것.

스키마:
{
  "concepts": ["..."],
  "asc_references": ["..."],
  "topic_tags": ["..."],
  "trap_pattern": "..." 또는 null,
  "triggers": [
    {
      "keyword": "...",
      "auto_rule": "...",
      "trap": "...",
      "comparison": "...",
      "irrelevant": "..."
    }
  ]
}`;

  // ── JSON 복구 헬퍼 ──────────────────────────────────────────
  function repairJson(raw: string): string {
    let s = raw.trimEnd().replace(/,\s*$/, ''); // 후행 쉼표 제거
    let braces = 0, brackets = 0;
    let inString = false, escape = false;
    for (const ch of s) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '[') brackets++;
      else if (ch === ']') brackets--;
    }
    if (inString) s += '"';                          // 열린 문자열 닫기
    for (let i = 0; i < brackets; i++) s += ']';    // 열린 배열 닫기
    for (let i = 0; i < braces; i++) s += '}';      // 열린 객체 닫기
    return s;
  }

  function extractRawBody(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) return fenced[1].trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }

  // ── Anthropic 호출 + 파싱 (최대 2회 재시도) ─────────────────
  const MAX_ATTEMPTS = 3;
  let parsed: unknown = null;
  let lastApiErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let msg: Awaited<ReturnType<typeof anthropic.messages.create>>;
    try {
      console.log(`[analyze] Anthropic 호출 (시도 ${attempt}/${MAX_ATTEMPTS})`);
      msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (apiErr) {
      lastApiErr = apiErr;
      console.error(`[analyze] Anthropic 호출 실패 (시도 ${attempt}):`, apiErr instanceof Error ? apiErr.message : apiErr);
      if (attempt === MAX_ATTEMPTS) {
        finish(502, { error: 'Anthropic API 호출 실패', detail: apiErr instanceof Error ? apiErr.message : String(apiErr) });
        return;
      }
      continue;
    }

    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      console.error(`[analyze] no text block (시도 ${attempt})`);
      if (attempt === MAX_ATTEMPTS) { finish(502, { error: 'no text in response' }); return; }
      continue;
    }
    const text = block.text.trim();
    console.log(`[analyze] raw 응답 (시도 ${attempt}):`, text.slice(0, 400));

    const rawBody = extractRawBody(text);

    // 1차: 그대로 파싱
    try {
      parsed = JSON.parse(rawBody);
      console.log(`[analyze] JSON 파싱 성공 (시도 ${attempt})`);
      break;
    } catch {
      // 2차: 잘린 JSON 복구 후 재시도
      try {
        const repaired = repairJson(rawBody);
        parsed = JSON.parse(repaired);
        console.log(`[analyze] JSON 복구 후 파싱 성공 (시도 ${attempt}), 복구된 길이: ${repaired.length}`);
        break;
      } catch (e2) {
        console.error(`[analyze] JSON 파싱/복구 실패 (시도 ${attempt}):`, e2 instanceof Error ? e2.message : e2, '\nraw tail:', rawBody.slice(-200));
        if (attempt === MAX_ATTEMPTS) {
          // 최종 실패 시 빈 구조로 fallback
          console.warn('[analyze] 모든 시도 실패 — 빈 extracted로 fallback');
          parsed = { concepts: [], asc_references: [], topic_tags: [], trap_pattern: null, triggers: [] };
          break;
        }
      }
    }
  }

  // ── 파싱 결과 가공 ───────────────────────────────────────────
  try {
    if (!parsed || typeof parsed !== 'object') {
      finish(502, { error: 'invalid extraction shape' });
      return;
    }

    const obj = parsed as Partial<ExtractedConcepts> & { triggers?: unknown };
    const rawTriggers = Array.isArray((obj as { triggers?: unknown }).triggers)
      ? (obj as { triggers: unknown[] }).triggers
      : [];
    const triggers: ConceptTrigger[] = rawTriggers
      .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
      .map((t) => ({
        keyword: typeof t.keyword === 'string' ? t.keyword : '',
        auto_rule: typeof t.auto_rule === 'string' ? t.auto_rule : '',
        trap: typeof t.trap === 'string' ? t.trap : '',
        comparison: typeof t.comparison === 'string' ? t.comparison : '',
        irrelevant: typeof t.irrelevant === 'string' ? t.irrelevant : '',
      }))
      .filter((t) => t.keyword);

    const extracted: ExtractedConcepts = {
      concepts: Array.isArray(obj.concepts) ? obj.concepts.filter((x): x is string => typeof x === 'string') : [],
      asc_references: Array.isArray(obj.asc_references)
        ? obj.asc_references.filter((x): x is string => typeof x === 'string')
        : [],
      topic_tags: Array.isArray(obj.topic_tags)
        ? obj.topic_tags.filter((x): x is string => typeof x === 'string')
        : [],
      trap_pattern: typeof obj.trap_pattern === 'string' ? obj.trap_pattern : null,
      triggers,
    };

    // topic_id 추론/보정
    let correctedTopicId: string | null = null;
    if (topicId) {
      const inference = inferTopicId(extracted.concepts, extracted.topic_tags, extracted.asc_references, topicId);
      if (inference.corrected) {
        correctedTopicId = inference.topicId;
        console.log(`[analyze] topic_id corrected: ${topicId} → ${correctedTopicId}`);
      }
    }

    // ── 즉시 응답 (파일 저장 전) ────────────────────────────────
    const exampleQuestion = await exampleQuestionPromise.catch(() => null);
    console.log('[analyze] exampleQuestion 생성:', exampleQuestion ? '성공' : '실패/null');
    finish(200, { extracted, learned: null, correctedTopicId, exampleQuestion });
    console.log('[analyze] 200 응답 완료');

    // ── 파일 저장만 fire-and-forget ─────────────────────────────
    applyExtraction(extracted).catch((saveErr) => {
      console.error('[analyze] 파일 저장 실패 (무시):', saveErr instanceof Error ? saveErr.message : saveErr);
    });

  } catch (err) {
    console.error('[analyze] outer catch 에러:', err);
    finish(500, { error: err instanceof Error ? err.message : 'unknown' });
  }
});

// ─────────────────────────────────────────────
// GET /api/learned-concepts
// ─────────────────────────────────────────────
router.get('/learned-concepts', async (_req: Request, res: Response) => {
  try {
    const learned = await readLearned();
    return res.json(learned);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
