import { Router, Request, Response } from 'express';

const router = Router();

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * POST /api/tts
 * body: { text: string }
 * response: { audioContent: string }  — base64 MP3
 */
router.post('/', async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    return res.status(400).json({ error: 'text required' });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_TTS_API_KEY not configured' });
  }

  try {
    const gRes = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: text.slice(0, 500) },
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    if (!gRes.ok) {
      const errBody = await gRes.text();
      console.error('[tts] Google TTS error:', gRes.status, errBody.slice(0, 200));
      return res.status(502).json({ error: 'Google TTS failed', status: gRes.status });
    }

    const data = await gRes.json() as { audioContent?: string };
    if (!data.audioContent) {
      return res.status(502).json({ error: 'No audioContent in response' });
    }

    return res.json({ audioContent: data.audioContent });
  } catch (err) {
    console.error('[tts] fetch error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
