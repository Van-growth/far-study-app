import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireApiKey } from '../middleware/requireApiKey';

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

interface Timepoint { markName: string; timeSeconds: number }
interface SynthResult { audioContent: string; timepoints: Timepoint[] }

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+["']?\s*/g);
  if (parts && parts.length > 0) return parts.map((s) => s.trim()).filter(Boolean);
  return [text.trim()].filter(Boolean);
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function synthesize(
  input: { text: string } | { ssml: string },
  withTimepoints = false,
): Promise<SynthResult | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;
  const reqBody: Record<string, unknown> = {
    input: 'text' in input
      ? { text: (input as { text: string }).text.slice(0, 1000) }
      : { ssml: (input as { ssml: string }).ssml },
    voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
  };
  if (withTimepoints) reqBody.enableTimePointingModes = ['SSML_MARK'];
  const gRes = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });
  if (!gRes.ok) {
    console.error('[tts] Google error:', gRes.status, (await gRes.text()).slice(0, 200));
    return null;
  }
  const data = await gRes.json() as { audioContent?: string; timepoints?: Timepoint[] };
  if (!data.audioContent) return null;
  return { audioContent: data.audioContent, timepoints: data.timepoints ?? [] };
}

/**
 * POST /api/tts
 * body: { text: string }
 * response: { audioContent: string }  — base64 MP3 (raw text, no script generation)
 */
router.post('/', requireApiKey, async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  if (!process.env.GOOGLE_TTS_API_KEY) return res.status(500).json({ error: 'GOOGLE_TTS_API_KEY not configured' });
  try {
    const result = await synthesize({ text });
    if (!result) return res.status(502).json({ error: 'Google TTS failed' });
    return res.json({ audioContent: result.audioContent });
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
router.post('/podcast', requireApiKey, async (req: Request, res: Response) => {
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
    const msg = await anthropic.beta.promptCaching.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: [{ type: 'text', text: PODCAST_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });
    const script = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    if (!script) return res.status(502).json({ error: 'Script generation failed' });

    const ttsScript = script.replace(/GAAP/g, 'gap');
    const result = await synthesize({ text: ttsScript });
    if (!result) return res.status(502).json({ error: 'Google TTS failed' });

    return res.json({ audioContent: result.audioContent, script, timepoints: [] });
  } catch (err) {
    console.error('[tts/podcast] error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
