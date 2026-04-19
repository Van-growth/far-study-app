import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * POST /api/error-patterns/diagnose
 * 학생이 오답 태깅을 완료한 시점에 호출. 2-3줄 한국어 진단 + 다음에 같은
 * 유형을 만났을 때 써야 할 체크포인트 1줄을 돌려준다. 실패 시 200 + diagnosis=''
 * 로 조용히 끝내 UI 저장 플로우는 막지 않는다.
 *
 * body: { question, userAnswer, correctAnswer, patternName, patternDescription, topic }
 */
router.post('/diagnose', async (req: Request, res: Response) => {
  const {
    question,
    userAnswer,
    correctAnswer,
    patternName,
    patternDescription,
    topic,
    userNote,
  } = req.body as {
    question?: string;
    userAnswer?: string;
    correctAnswer?: string;
    patternName?: string;
    patternDescription?: string;
    topic?: string;
    userNote?: string | null;
  };

  if (!question || !patternName) {
    return res.status(400).json({ error: 'question and patternName required' });
  }

  const hasNote = typeof userNote === 'string' && userNote.trim().length > 0;

  const system =
    'You are a USCPA FAR exam tutor. Diagnose why the student got a question wrong, ' +
    'given the error pattern they self-identified. Respond in Korean only. ' +
    'Keep it tight: 2~3 lines of diagnosis + exactly one "다음 체크포인트:" line at the end. ' +
    'Use "Book value(장부가액)" style for bilingual terms. No greetings, no filler.';

  const user =
    `[문제]\n${question}\n\n` +
    `[학생 오답] ${userAnswer ?? '(기록 없음)'}\n` +
    `[정답] ${correctAnswer ?? '(기록 없음)'}\n` +
    `[학생이 선택한 오류 패턴] ${patternName}` +
    (patternDescription ? ` — ${patternDescription}` : '') +
    (topic ? `\n[토픽] ${topic}` : '') +
    (hasNote
      ? `\n\n[학생이 직접 기록한 실수 내용]\n${userNote!.trim()}\n\n` +
        '⚠️ 위 학생 기록이 최우선이다. 반드시 이 내용을 중심으로 진단하고, ' +
        'AI가 임의로 다른 원인을 추측하지 말 것. ' +
        '진단은 학생이 기록한 실수를 구체적으로 짚어주는 방향으로 작성.'
      : '\n\n학생이 따로 기록한 내용은 없다. 문제와 오류 패턴만으로 왜 틀렸는지 추측 진단하고, ' +
        '다음에 같은 유형을 풀 때 먼저 확인해야 할 체크포인트 1줄을 덧붙여줘.');

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const diagnosis =
      message.content[0]?.type === 'text' ? message.content[0].text : '';
    return res.json({ diagnosis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn('[error-patterns] diagnose failed:', msg);
    return res.json({ diagnosis: '', error: msg });
  }
});

export default router;
