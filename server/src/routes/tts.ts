import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

const PODCAST_SYSTEM = `Convert the following accounting facts into a natural 20-30 second podcast script.
DO NOT add any information not provided.
DO NOT mention any ASC numbers or standard references.
DO NOT invent examples or numbers.
Only reformat what's given into conversational English.
Focus on: what the rule is, and what trap to avoid.
Return plain text only. No markdown, no headers, no bullet points, no dashes, no asterisks, no duration notes. Just natural flowing speech text.`;

async function synthesize(text: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;
  const gRes = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: text.slice(0, 1000) },
      voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
    }),
  });
  if (!gRes.ok) {
    console.error('[tts] Google error:', gRes.status, (await gRes.text()).slice(0, 200));
    return null;
  }
  const data = await gRes.json() as { audioContent?: string };
  return data.audioContent ?? null;
}

/**
 * POST /api/tts
 * body: { text: string }
 * response: { audioContent: string }  — base64 MP3 (raw text, no script generation)
 */
router.post('/', async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  if (!process.env.GOOGLE_TTS_API_KEY) return res.status(500).json({ error: 'GOOGLE_TTS_API_KEY not configured' });
  try {
    const audioContent = await synthesize(text);
    if (!audioContent) return res.status(502).json({ error: 'Google TTS failed' });
    return res.json({ audioContent });
  } catch (err) {
    console.error('[tts] error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/tts/podcast
 * body: { topicId: string | null, oneLiner: string | null, trapPattern: string | null }
 * 1. Haiku generates a 20-30s podcast script
 * 2. Google TTS synthesizes it with WaveNet-F
 * response: { audioContent: string, script: string }
 */
router.post('/podcast', async (req: Request, res: Response) => {
  const { topicId, oneLiner, trapPattern } = req.body as {
    topicId?: string | null;
    oneLiner?: string | null;
    trapPattern?: string | null;
  };

  if (!oneLiner?.trim() && !trapPattern?.trim()) {
    return res.status(400).json({ error: 'oneLiner or trapPattern required' });
  }
  if (!process.env.GOOGLE_TTS_API_KEY) return res.status(500).json({ error: 'GOOGLE_TTS_API_KEY not configured' });

  const userMsg = [
    topicId ? `Topic: ${topicId}` : null,
    oneLiner ? `Rule: ${oneLiner}` : null,
    trapPattern ? `Trap: ${trapPattern}` : null,
  ].filter(Boolean).join('\n');

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: PODCAST_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    });
    const script = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    if (!script) return res.status(502).json({ error: 'Script generation failed' });

    const audioContent = await synthesize(script);
    if (!audioContent) return res.status(502).json({ error: 'Google TTS failed' });

    return res.json({ audioContent, script });
  } catch (err) {
    console.error('[tts/podcast] error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
