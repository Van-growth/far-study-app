import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5-20250929';

interface ModuleStat {
  moduleId: string;
  label: string;
  correctRate: number;
  avgSeconds: number | null;
  totalSolved: number;
}

interface CoachStats {
  totalSolved: number;
  lastActive: string | null;
  dueCount: number;
  moduleStats: ModuleStat[];
  recentWrong: string[];
  strongModules: string[];
  weakModules: string[];
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(stats: CoachStats): string {
  const modTable = stats.moduleStats
    .slice(0, 24)
    .map(
      (m) =>
        `- ${m.moduleId} ${m.label}: 정답률 ${m.correctRate}%, 평균 ${
          m.avgSeconds !== null ? `${m.avgSeconds}초` : '—'
        }, ${m.totalSolved}회 풀이`,
    )
    .join('\n');

  return `너는 USCPA FAR 시험 AI 코치다. 학습 데이터를 바탕으로 수험생에게 먼저 말을 건다.

규칙:
- 첫 메시지는 반드시 현황 요약 + 오늘 추천 액션 2~3개
- 강점 1개, 약점 1개 반드시 언급
- 말투는 친근하고 구체적, 수치 기반
- 추천은 항상 실행 가능한 것 (예: F4-M3 10문제, Feynman 설명)
- 5문장 이내로 시작, 이후 대화에서 확장
- 별점/추정치 금지, 실제 데이터만 사용
- 답변은 한국어로
- 모듈은 "F[n]-M[n] 모듈명" 형식으로 언급
- 마무리 요청 시: 7문장 이내로 (1) 오늘 한 줄 요약 (2) 틀린 문제 위주
  분석 — 어떤 모듈에서 많이 틀렸는지, 공통 함정 패턴 (3) 맞은 것 중
  칭찬 1개 (4) 내일 반드시 할 것 1~2개 (모듈명 + 행동) (5) 격려 한 마디

수험생 현황 (최신 학습 데이터):
- 총 풀이: ${stats.totalSolved}문제
- 마지막 접속: ${stats.lastActive ?? '없음'}
- DUE 복습: ${stats.dueCount}개
- 강점 모듈(정답률 80% 이상, 3회 이상): ${stats.strongModules.join(', ') || '없음'}
- 약점 모듈(정답률 60% 미만, 3회 이상): ${stats.weakModules.join(', ') || '없음'}
- 최근 틀린 모듈: ${stats.recentWrong.join(', ') || '없음'}

모듈별 성과:
${modTable || '데이터 없음'}

위 데이터만 사용. 없는 수치/날짜 추측 금지. 데이터 부족하면 "아직 데이터가 부족해요"라고 솔직하게 말할 것.`;
}

// POST /api/coach/analyze — SSE stream
router.post('/analyze', async (req: Request, res: Response) => {
  const { stats, messages } = req.body as { stats?: CoachStats; messages?: ChatMsg[] };
  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'stats required' });
  }

  const system = buildSystemPrompt(stats);
  const history = Array.isArray(messages) ? messages : [];

  // Empty history → synthesize a user message so Claude generates the greeting.
  const conv: ChatMsg[] =
    history.length === 0
      ? [
          {
            role: 'user',
            content:
              '위 학습 데이터를 확인하고 오늘의 현황 요약 + 추천 액션 2~3개로 먼저 말을 걸어줘.',
          },
        ]
      : history;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: conv,
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
    const m = err instanceof Error ? err.message : 'unknown';
    res.write(`data: ${JSON.stringify({ error: m })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
