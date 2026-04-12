import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-haiku-4-5-20251001';

/**
 * POST /api/claude/chat — SSE streaming
 * body: { messages, systemPrompt, currentTopic }
 */
router.post('/chat', async (req: Request, res: Response) => {
  const { messages, systemPrompt, currentTopic } = req.body as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    systemPrompt?: string;
    currentTopic?: string;
  };

  if (!messages?.length) {
    return res.status(400).json({ error: 'messages required' });
  }

  const system = (systemPrompt ?? '') +
    (currentTopic ? `\n\n현재 학습 중인 토픽: ${currentTopic}` : '');

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable reverse-proxy buffering so chunks reach the client immediately.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': ping\n\n');

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages,
    });

    stream.on('text', (text: string) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err: Error) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * POST /api/claude/feynman — regular JSON (no streaming)
 * body: { text, topic, feynmanPrompt }
 */
router.post('/feynman', async (req: Request, res: Response) => {
  const { text, topic, feynmanPrompt } = req.body as {
    text: string;
    topic: string;
    feynmanPrompt?: string;
  };

  if (!text || !topic) {
    return res.status(400).json({ error: 'text and topic are required' });
  }

  const system = `You are a USCPA FAR exam tutor. The student is using the Feynman Technique to explain: "${topic}".
Evaluate their explanation in Korean.
Structure your response EXACTLY as:
1. 잘 설명한 부분 (1-2줄)
2. 놓친 핵심 개념 (bullet points with •)
3. 시험에서 꼭 기억할 한 줄 (wrap in **bold**)
Be concise and exam-focused. Respond only in Korean.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [
        {
          role: 'user',
          content: `[토픽] ${topic}\n[프롬프트] ${feynmanPrompt ?? ''}\n\n[내 설명]\n${text}`,
        },
      ],
    });

    const feedback =
      message.content[0]?.type === 'text' ? message.content[0].text : '';
    return res.json({ feedback });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

export default router;
