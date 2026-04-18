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
  } = req.body as {
    question?: string;
    userAnswer?: string;
    correctAnswer?: string;
    patternName?: string;
    patternDescription?: string;
    topic?: string;
  };

  if (!question || !patternName) {
    return res.status(400).json({ error: 'question and patternName required' });
  }

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
    '\n\n이 학생이 왜 틀렸는지 진단하고, 다음에 같은 유형을 풀 때 먼저 확인해야 할 체크포인트 1줄을 덧붙여줘.';

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

/**
 * POST /api/error-patterns/briefing
 * 내 pattern_stats top N + 전체 평균을 받아 "오늘 집중해야 할 것 3가지" 한국어 브리핑.
 * body: { my: [{pattern_id, name, occurrence, recent_rate}], global: [...], weakTopics: [...] }
 */
router.post('/briefing', async (req: Request, res: Response) => {
  const { my, global: globalStats, weakTopics } = req.body as {
    my?: { pattern_id: string; name: string; occurrence: number; recent_rate: number }[];
    global?: { pattern_id: string; name: string; user_count: number; total_occurrence: number }[];
    weakTopics?: { topicLabel: string; accuracy: number }[];
  };

  const system =
    'You are a USCPA FAR study coach. Produce a focused 3-part Korean briefing. ' +
    'Format EXACTLY with these three sections, each 1~2 lines, nothing else:\n' +
    '① 위험: (학생 본인의 최상위 반복 패턴을 지목)\n' +
    '② 비교: (전체 수험생 평균 대비 본인 위치를 숫자로 한 줄)\n' +
    '③ 오늘 추천: (어떤 모듈/패턴부터 풀지 구체 제안)\n' +
    'No preamble, no closing line.';

  const user = JSON.stringify({
    my_top_patterns: my ?? [],
    global_top_patterns: globalStats ?? [],
    weak_topics: weakTopics ?? [],
  });

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const briefing =
      message.content[0]?.type === 'text' ? message.content[0].text : '';
    return res.json({ briefing });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn('[error-patterns] briefing failed:', msg);
    return res.json({ briefing: '', error: msg });
  }
});

export default router;
