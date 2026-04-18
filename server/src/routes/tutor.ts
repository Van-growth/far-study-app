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

export default router;
