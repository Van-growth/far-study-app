import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import { getModulePerformance, getQuizMeta, getRecentWrongModules } from '../lib/db';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

export interface CoachModuleStat {
  moduleId: string;
  label: string;
  correctRate: number;
  avgSeconds: number | null;
  totalSolved: number;
}

export interface CoachStats {
  totalSolved: number;
  lastActive: string | null;
  dueCount: number;
  moduleStats: CoachModuleStat[];
  recentWrong: string[];
  strongModules: string[];
  weakModules: string[];
}

export interface CoachMsg {
  role: 'user' | 'assistant';
  content: string;
}

// Min attempts to qualify as strong/weak — avoids single-answer noise.
const QUALIFY_MIN = 3;

/** Assemble the current learning snapshot sent to the coach on every turn. */
export async function assembleCoachStats(userId: string): Promise<CoachStats> {
  const [perf, meta, recent] = await Promise.all([
    getModulePerformance(userId),
    getQuizMeta(userId),
    getRecentWrongModules(userId, 5),
  ]);

  const moduleStats: CoachModuleStat[] = Object.values(perf)
    .filter((p) => p.total >= 1)
    .map((p) => ({
      moduleId: p.topicId,
      label: allTopics.find((t) => t.id === p.topicId)?.label ?? p.topicId,
      correctRate: p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0,
      avgSeconds: p.avgSeconds,
      totalSolved: p.total,
    }))
    .sort((a, b) => b.totalSolved - a.totalSolved);

  const strongModules = moduleStats
    .filter((m) => m.totalSolved >= QUALIFY_MIN && m.correctRate >= 80)
    .sort((a, b) => b.correctRate - a.correctRate)
    .map((m) => m.moduleId);
  const weakModules = moduleStats
    .filter((m) => m.totalSolved >= QUALIFY_MIN && m.correctRate < 60)
    .sort((a, b) => a.correctRate - b.correctRate)
    .map((m) => m.moduleId);

  // DUE count comes from the local SRS store (no extra DB hit).
  const dueCount = useStudyStore.getState().getDueCount();

  return {
    totalSolved: meta.totalSolved,
    lastActive: meta.lastActive,
    dueCount,
    moduleStats,
    recentWrong: recent,
    strongModules,
    weakModules,
  };
}

export async function streamCoachResponse(
  stats: CoachStats,
  messages: CoachMsg[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/coach/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, messages }),
    });
    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}`);
      onDone();
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const payload = JSON.parse(data) as { text?: string; error?: string };
          if (payload.error) {
            onError(payload.error);
            continue;
          }
          if (payload.text) onChunk(payload.text);
        } catch {
          /* skip malformed chunk */
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : 'network error');
    onDone();
  }
}
