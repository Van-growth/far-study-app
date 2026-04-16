import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import {
  applyExtraction,
  read as readLearned,
  ExtractedConcepts,
} from '../lib/learnedConcepts';
import { inferTopicId } from '../lib/topicInference';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5-20250929';

// ─────────────────────────────────────────────
// POST /api/extract-concepts
// body: { questionText, userAnswer?, correctAnswer?, topicId? }
// NOTE: questionText is used only to call Claude. We DO NOT persist the
//       original text — only the extracted concept metadata.
// ─────────────────────────────────────────────
router.post('/extract-concepts', async (req: Request, res: Response) => {
  const { questionText, userAnswer, correctAnswer, topicId } = req.body as {
    questionText?: string;
    userAnswer?: string | null;
    correctAnswer?: string | null;
    topicId?: string | null;
  };
  if (!questionText || typeof questionText !== 'string') {
    return res.status(400).json({ error: 'questionText required' });
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

절대 문제 원문의 숫자/인물명/회사명/구체적 시나리오를 복사하지 마세요. 개념 키워드와 패턴만.

STRICT JSON ONLY. 마크다운 펜스/부연 설명 금지. { 로 시작하고 } 로 끝낼 것.

스키마:
{
  "concepts": ["..."],
  "asc_references": ["..."],
  "topic_tags": ["..."],
  "trap_pattern": "..." 또는 null
}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
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
      return res.status(502).json({
        error: 'extraction JSON parse failed',
        detail: e instanceof Error ? e.message : 'unknown',
      });
    }
    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'invalid extraction shape' });
    }
    const obj = parsed as Partial<ExtractedConcepts>;
    const extracted: ExtractedConcepts = {
      concepts: Array.isArray(obj.concepts) ? obj.concepts.filter((x): x is string => typeof x === 'string') : [],
      asc_references: Array.isArray(obj.asc_references)
        ? obj.asc_references.filter((x): x is string => typeof x === 'string')
        : [],
      topic_tags: Array.isArray(obj.topic_tags)
        ? obj.topic_tags.filter((x): x is string => typeof x === 'string')
        : [],
      trap_pattern: typeof obj.trap_pattern === 'string' ? obj.trap_pattern : null,
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

    const learned = await applyExtraction(extracted);
    return res.json({ extracted, learned, correctedTopicId });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
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
