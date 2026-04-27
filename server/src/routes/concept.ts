import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../lib/supabase';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

type ErrorType = 'explanation' | 'answer' | 'option';

function buildSystem(errorType: ErrorType): string {
  const base = '너는 USCPA FAR 검증 에이전트다. US GAAP 기준으로 피드백을 먼저 검증해라. JSON만 반환. 절대 다른 텍스트 없음.';

  if (errorType === 'explanation') {
    return `${base}
해설 오류 검증 모드: 정답은 맞고 해설만 틀렸을 경우 해설만 수정한다.
피드백이 맞으면: { "valid": true, "correct_answer": "<기존 정답 그대로>", "explanation": "<수정된 해설>" }
피드백이 틀렸으면: { "valid": false, "reason": "<기존 해설이 맞는 이유>" }`;
  }

  if (errorType === 'answer') {
    return `${base}
정답 오류 검증 모드: 정답 자체가 틀렸을 경우 correct_answer를 수정하고 explanation도 새 정답에 맞게 갱신한다.
피드백이 맞으면: { "valid": true, "correct_answer": "<수정된 정답>", "explanation": "<갱신된 해설>" }
피드백이 틀렸으면: { "valid": false, "reason": "<기존 정답이 맞는 이유>" }`;
  }

  // option
  return `${base}
선지 오류 검증 모드: 선지(options)가 틀렸을 경우 options, correct_answer, explanation을 모두 수정한다.
선지는 "A. ...", "B. ...", "C. ...", "D. ..." 형식을 유지한다.
피드백이 맞으면: { "valid": true, "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "<예: A>", "explanation": "<수정된 해설>" }
피드백이 틀렸으면: { "valid": false, "reason": "<기존 선지가 맞는 이유>" }`;
}

/**
 * POST /api/concept/fix
 * body: { id, feedback, errorType, current: { question, correct_answer, explanation, options? } }
 */
router.post('/fix', async (req: Request, res: Response) => {
  console.log('[concept/fix] 요청 수신:', JSON.stringify(req.body).slice(0, 200));

  const { id, feedback, errorType, current } = req.body as {
    id: string;
    feedback: string;
    errorType: ErrorType;
    current: { question: string; correct_answer: string; explanation: string; options?: string[] };
  };

  if (!id || !feedback?.trim() || !current?.question) {
    return res.status(400).json({ error: 'id, feedback, and current required' });
  }
  if (!errorType || !['explanation', 'answer', 'option'].includes(errorType)) {
    return res.status(400).json({ error: 'errorType must be explanation | answer | option' });
  }

  const optionsText = Array.isArray(current.options) && current.options.length > 0
    ? `\n현재 선지:\n${current.options.join('\n')}`
    : '';

  const userMsg = `문제: ${current.question}${optionsText}
현재 정답: ${current.correct_answer}
현재 해설: ${current.explanation}
피드백: ${feedback}`;

  try {
    console.log('[concept/fix] Claude API 호출 (model:', MODEL, ', errorType:', errorType, ')');
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: buildSystem(errorType),
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[concept/fix] JSON 파싱 실패 — raw:', raw);
      return res.status(500).json({ error: 'AI 응답 파싱 실패' });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      valid?: boolean;
      correct_answer?: string;
      explanation?: string;
      options?: string[];
      reason?: string;
    };

    if (parsed.valid === false) {
      return res.json({ valid: false, reason: parsed.reason ?? '기존 정답이 맞습니다.' });
    }

    return res.json({
      valid: true,
      correct_answer: parsed.correct_answer ?? current.correct_answer,
      explanation: parsed.explanation ?? current.explanation,
      ...(errorType === 'option' && parsed.options ? { options: parsed.options } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[concept/fix] 오류:', msg);
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/concept/confirm-fix
 * body: { id, errorType, feedback, newAnswer, newExplanation, newOptions?, userId? }
 * Updates concept_extractions + logs to feedback_logs.
 */
router.post('/confirm-fix', async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { id, errorType, feedback, newAnswer, newExplanation, newOptions, userId } = req.body as {
    id: string;
    errorType: ErrorType;
    feedback: string;
    newAnswer: string;
    newExplanation: string;
    newOptions?: string[];
    userId?: string;
  };

  if (!id || !errorType || !newAnswer) {
    return res.status(400).json({ error: 'id, errorType, newAnswer required' });
  }

  try {
    const { data } = await supabase
      .from('concept_extractions')
      .select('example_question')
      .eq('id', id)
      .single();

    const currentEq = (data as { example_question?: unknown } | null)?.example_question;
    const base = typeof currentEq === 'object' && currentEq !== null
      ? (currentEq as Record<string, unknown>)
      : {};

    const mergedEq: Record<string, unknown> = {
      ...base,
      answer: newAnswer,
      explanation: newExplanation,
    };
    if (errorType === 'option' && Array.isArray(newOptions) && newOptions.length > 0) {
      mergedEq.options = newOptions;
    }

    const { error: updateError } = await supabase
      .from('concept_extractions')
      .update({
        example_question: mergedEq,
        feedback: typeof feedback === 'string' ? feedback.slice(0, 2000) : null,
        is_fixed: true,
        fixed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[confirm-fix] update error:', updateError.message);
      return res.status(500).json({ error: updateError.message });
    }

    // Log to feedback_logs (fire-and-forget — don't fail the request if logging fails)
    supabase.from('feedback_logs').insert({
      user_id: userId ?? null,
      source: 'quiz',
      message_id: `fix_${id}_${Date.now()}`,
      rating: 'down',
      reason: typeof feedback === 'string' ? feedback.slice(0, 500) : null,
      extraction_id: id,
      error_type: errorType,
      fix_applied: true,
      fix_applied_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('[confirm-fix] feedback_logs insert error:', error.message);
    });

    return res.json({ saved: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[confirm-fix] 오류:', msg);
    return res.status(500).json({ error: msg });
  }
});

export default router;
