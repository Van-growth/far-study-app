import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * POST /api/tutor/briefing
 *
 * Home page AI tutor briefing. Called at most once per day per user
 * (client caches in localStorage). Input is already-aggregated per-user
 * data so the server never touches Supabase — keeps the call cheap and
 * privacy-safe.
 *
 * body: {
 *   weekAnalyzeCount:   number,
 *   weakestModule:      { topicId, label, accuracy, sampleSize } | null,
 *   improvingModule:    { topicId, label, thisWeekAcc, lastWeekAcc, delta } | null,
 *   weakestConcept:     { tag, accuracy, total } | null,
 *   topErrorPattern:    { patternId, name, occurrence } | null,
 *   coveragePercent:    number,
 *   coveredModules:     number,
 *   totalModules:       number,
 *   examDaysLeft:       number | null
 * }
 *
 * returns: { summary: string, actions: string[], dayEstimate: string }
 */
router.post('/briefing', async (req: Request, res: Response) => {
  const payload = req.body as Record<string, unknown>;

  const system =
    'You are a FAR exam study tutor for a Korean USCPA candidate. ' +
    'Generate a daily landing-page briefing in Korean only, in three parts:\n' +
    '1) "summary": 2~3 lines on current status (this week\'s analysis count, ' +
    'weakest module, improving module). Plain text, no bullets.\n' +
    '2) "actions": exactly 3 short Korean action items (string array). Each ' +
    'item 1 line. Order: module focus -> concept/calc to strengthen -> ' +
    'most frequent error pattern to watch.\n' +
    '3) "dayEstimate": 1 line about pacing. If examDaysLeft is not null, factor ' +
    'it in; otherwise comment on coverage speed.\n' +
    'Return ONLY a compact JSON object with keys summary, actions, dayEstimate. ' +
    'No preamble, no markdown fences. Use "Book value(장부가액)" style for bilingual terms.';

  const user = JSON.stringify(payload);

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text =
      message.content[0]?.type === 'text' ? message.content[0].text : '';

    // Extract the JSON block even if the model wraps it in prose or code fences.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({
        summary: text || '브리핑을 생성하지 못했어요.',
        actions: [],
        dayEstimate: '',
      });
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        summary?: string;
        actions?: string[];
        dayEstimate?: string;
      };
      return res.json({
        summary: parsed.summary ?? '',
        actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
        dayEstimate: parsed.dayEstimate ?? '',
      });
    } catch {
      return res.json({
        summary: text,
        actions: [],
        dayEstimate: '',
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn('[tutor] briefing failed:', msg);
    return res.json({
      summary: '',
      actions: [],
      dayEstimate: '',
      error: msg,
    });
  }
});

/**
 * POST /api/tutor/daily-briefing
 *
 * 복습 탭 진입 시 AI 데일리 브리핑 생성.
 * 클라이언트가 데이터를 집계해서 전송 → 서버는 Haiku 호출 후 briefingText + suggestedMode 반환.
 *
 * body: {
 *   todayKnew:            number,
 *   todayConfused:        number,
 *   dailyGoal:            number,
 *   totalConfusedCards:   number,
 *   weakestTopics:        { topicId, label?, attempts, correct }[],
 *   recentConfusedTopics: { topicId, label?, confusedCount }[],
 *   yesterdaySession:     { briefingText, suggestedMode, wasClicked } | null,
 * }
 *
 * returns: { briefingText: string, suggestedMode: 'queue'|'confused'|'normal' }
 */
router.post('/daily-briefing', async (req: Request, res: Response) => {
  const {
    todayKnew = 0,
    todayConfused = 0,
    dailyGoal = 10,
    totalConfusedCards = 0,
    weakestTopics = [],
    recentConfusedTopics = [],
    yesterdaySession = null,
  } = req.body as {
    todayKnew: number;
    todayConfused: number;
    dailyGoal: number;
    totalConfusedCards: number;
    weakestTopics: { topicId: string; label?: string; attempts: number; correct: number }[];
    recentConfusedTopics: { topicId: string; label?: string; confusedCount: number }[];
    yesterdaySession: { briefingText: string; suggestedMode: string; wasClicked: boolean } | null;
  };

  const todayTotal = todayKnew + todayConfused;
  const goalAchieved = dailyGoal > 0 && todayTotal >= dailyGoal;

  const system = `너는 USCPA FAR 시험 준비 중인 한국인 수험생의 AI 학습 코치야.
아래 학습 데이터를 보고 오늘의 브리핑을 한국어로 작성해.

규칙:
1. 2~3문장으로 간결하게 (반말 체, 친근하고 따뜻한 코치 톤)
2. 어제 제안(yesterdaySession)이 있고 wasClicked=false면 → "어제 못 했던 거 오늘은 해보자" 언급
3. recentConfusedTopics에서 confusedCount >= 2인 토픽 있으면 → "개념노트 확인 필요" 언급
4. 목표 달성 여부 반영 (달성했으면 격려, 미달성이면 남은 것 언급)
5. suggestedMode 결정 기준:
   - "queue": totalConfusedCards >= 3이고 todayTotal < dailyGoal
   - "confused": totalConfusedCards > 0이고 todayTotal >= dailyGoal
   - "normal": 그 외

출력은 JSON만 (마크다운 펜스 금지):
{"briefingText":"...","suggestedMode":"queue"|"confused"|"normal"}`;

  const userMsg = JSON.stringify({
    todayKnew, todayConfused, dailyGoal, goalAchieved,
    totalConfusedCards,
    weakestTopics: weakestTopics.slice(0, 2),
    recentConfusedTopics: recentConfusedTopics.slice(0, 3),
    yesterdaySession,
  });

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ briefingText: text || '오늘도 화이팅!', suggestedMode: 'normal' });
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { briefingText?: string; suggestedMode?: string };
      const mode = (['queue', 'confused', 'normal'] as const).includes(parsed.suggestedMode as 'queue' | 'confused' | 'normal')
        ? parsed.suggestedMode as 'queue' | 'confused' | 'normal'
        : 'normal';
      return res.json({ briefingText: parsed.briefingText ?? '오늘도 화이팅!', suggestedMode: mode });
    } catch {
      return res.json({ briefingText: text, suggestedMode: 'normal' });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn('[tutor] daily-briefing failed:', msg);
    return res.json({ briefingText: '오늘도 열심히 해보자! 💪', suggestedMode: 'normal' });
  }
});

export default router;
