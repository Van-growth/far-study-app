import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * POST /api/concept/fix
 * body: { id, feedback, current: { question, correct_answer, explanation } }
 */
router.post('/fix', async (req: Request, res: Response) => {
  const { id, feedback, current } = req.body as {
    id: string;
    feedback: string;
    current: { question: string; correct_answer: string; explanation: string };
  };

  if (!id || !feedback?.trim() || !current?.question) {
    return res.status(400).json({ error: 'id, feedback, and current required' });
  }

  const system = `너는 USCPA FAR 전문 튜터다.
US GAAP 기준으로만 답해라.
반드시 JSON만 반환 (다른 텍스트 없이):
{ "correct_answer": string, "explanation": string }`;

  const userMsg = `문제: ${current.question}
현재 정답: ${current.correct_answer}
현재 해설: ${current.explanation}
피드백: ${feedback}
위 피드백을 반영해서 수정해줘.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[concept/fix] Failed to parse AI response:', text);
      return res.status(500).json({ error: 'AI 응답 파싱 실패' });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { correct_answer?: string; explanation?: string };
    return res.json({
      correct_answer: parsed.correct_answer ?? current.correct_answer,
      explanation: parsed.explanation ?? current.explanation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[concept/fix] Error:', msg);
    return res.status(500).json({ error: msg });
  }
});

export default router;
