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

// ─────────────────────────────────────────────
// POST /api/extract-concepts
// body: { questionText, userAnswer?, correctAnswer?, topicId? }
// NOTE: questionText is used only to call Claude. We DO NOT persist the
//       original text — only the extracted concept metadata.
// ─────────────────────────────────────────────
router.post('/extract-concepts', async (req: Request, res: Response) => {
  console.log('[analyze] extract-concepts 요청 받음');

  const finish = (status: number, body: object) => {
    if (res.headersSent) {
      console.warn('[analyze] finish() 무시 — 헤더 이미 전송됨', body);
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

  const wasWrong = userAnswer && correctAnswer && userAnswer !== correctAnswer;
  const answerLine =
    userAnswer != null && correctAnswer != null
      ? `\n사용자 답: ${userAnswer}\n정답: ${correctAnswer}\n${wasWrong ? '→ 오답' : '→ 정답'}`
      : '';
  const topicLine = topicId ? `\n현재 모듈: ${topicId}` : '';

  const prompt = `아래 FAR 문제 원문에서 학습 데이터로 재사용할 개념 메타데이터만 추출하세요.
${topicLine}

문제 원문:
${questionText}${answerLine}

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

  let msg: Awaited<ReturnType<typeof anthropic.messages.create>>;
  try {
    console.log('[analyze] Anthropic 호출 직전');
    msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    console.log('[analyze] Anthropic 호출 완료');
    console.log('응답 content 타입:', typeof msg, JSON.stringify(msg).slice(0, 200));
  } catch (apiErr) {
    console.error('[analyze] Anthropic API 호출 실패:', {
      message: apiErr instanceof Error ? apiErr.message : String(apiErr),
      status: (apiErr as { status?: number }).status,
      error: apiErr,
    });
    finish(502, { error: 'Anthropic API 호출 실패', detail: apiErr instanceof Error ? apiErr.message : String(apiErr) });
    return;
  }

  try {
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      finish(502, { error: 'no text in response' });
      return;
    }
    const text = block.text.trim();
    console.log('[analyze] Anthropic raw 응답:', text);
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let rawBody: string;
    if (fenced) {
      rawBody = fenced[1].trim();
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      rawBody = jsonMatch ? jsonMatch[0] : text;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch (e) {
      finish(502, {
        error: 'extraction JSON parse failed',
        detail: e instanceof Error ? e.message : 'unknown',
      });
      return;
    }
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
      const inference = inferTopicId(
        extracted.concepts,
        extracted.topic_tags,
        extracted.asc_references,
        topicId,
      );
      if (inference.corrected) {
        correctedTopicId = inference.topicId;
        console.log(`[analyze] topic_id corrected: ${topicId} → ${correctedTopicId}`);
      }
    }

    console.log('[analyze] res.json 호출 직전');
    console.log('[analyze] finish 호출');
    finish(200, { extracted, learned: null, correctedTopicId });
    console.log('[analyze] res.json 완료');

    // fire-and-forget: 응답 후 백그라운드 저장
    applyExtraction(extracted).catch((saveErr) => {
      console.error('[analyze] 백그라운드 저장 실패:', saveErr instanceof Error ? saveErr.message : saveErr);
    });
  } catch (err) {
    console.error('[analyze] outer catch 에러:', err);
    const m = err instanceof Error ? err.message : 'unknown';
    finish(500, { error: m });
  }
});

// ─────────────────────────────────────────────
// GET /api/learned-concepts
// Returns the current accumulated state for UI display.
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
