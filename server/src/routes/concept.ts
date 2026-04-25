import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-20250514';

/**
 * POST /api/concept/fix
 * body: { id, feedback, current: { question, correct_answer, explanation } }
 *
 * Response (valid):   { valid: true,  correct_answer, explanation }
 * Response (invalid): { valid: false, reason }
 */
router.post('/fix', async (req: Request, res: Response) => {
  console.log('[concept/fix] 요청 수신:', JSON.stringify(req.body).slice(0, 200));

  const { id, feedback, current } = req.body as {
    id: string;
    feedback: string;
    current: { question: string; correct_answer: string; explanation: string };
  };

  if (!id || !feedback?.trim() || !current?.question) {
    console.error('[concept/fix] 필수 필드 누락:', { id, hasFeedback: !!feedback, hasQuestion: !!current?.question });
    return res.status(400).json({ error: 'id, feedback, and current required' });
  }

  const system = `너는 USCPA FAR 검증 에이전트다.
피드백이 맞는지 US GAAP 기준으로 먼저 검증해라.

피드백이 맞으면:
{ "valid": true, "correct_answer": "수정값", "explanation": "수정된 해설" }

피드백이 틀렸으면 (기존 정답이 맞으면):
{ "valid": false, "reason": "기존 정답이 맞는 이유를 FAR 기준으로 설명" }

JSON만 반환. 절대 다른 텍스트 없음.`;

  const userMsg = `문제: ${current.question}
현재 정답: ${current.correct_answer}
현재 해설: ${current.explanation}
피드백: ${feedback}`;

  try {
    console.log('[concept/fix] Claude API 호출 시작 (model:', MODEL, ')');
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    console.log('[concept/fix] Claude 응답 raw:', raw.slice(0, 300));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[concept/fix] JSON 파싱 실패 — raw:', raw);
      return res.status(500).json({ error: 'AI 응답 파싱 실패' });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      valid?: boolean;
      correct_answer?: string;
      explanation?: string;
      reason?: string;
    };

    console.log('[concept/fix] 파싱 결과:', parsed);

    if (parsed.valid === false) {
      return res.json({ valid: false, reason: parsed.reason ?? '기존 정답이 맞습니다.' });
    }

    return res.json({
      valid: true,
      correct_answer: parsed.correct_answer ?? current.correct_answer,
      explanation: parsed.explanation ?? current.explanation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[concept/fix] 오류:', msg, err);
    return res.status(500).json({ error: msg });
  }
});

export default router;
