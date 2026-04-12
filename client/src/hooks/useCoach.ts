import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import {
  getModulePerformance,
  getQuizMeta,
  getRecentWrongModules,
  getCoachBootstrap,
  CoachBootstrap,
} from '../lib/db';

export type { CoachBootstrap };

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

// ── Scenario detection ────────────────────────────────────────
export type CoachScenario =
  | 'first_use'
  | 'first_today'
  | 'continuing_today'
  | 'returning';

export function detectScenario(b: CoachBootstrap): CoachScenario {
  if (b.totalSolved === 0) return 'first_use';
  if (b.todayCount > 0) return 'continuing_today';
  if (b.daysSinceLastActive !== null && b.daysSinceLastActive >= 2) return 'returning';
  return 'first_today';
}

/** Load the full coach bootstrap (stats + today/returning context). */
export async function loadCoachContext(
  userId: string,
): Promise<{ stats: CoachStats; bootstrap: CoachBootstrap; scenario: CoachScenario }> {
  const [stats, bootstrap] = await Promise.all([
    assembleCoachStats(userId),
    getCoachBootstrap(userId),
  ]);
  return { stats, bootstrap, scenario: detectScenario(bootstrap) };
}

/** Build the synthetic first-user-message that seeds the coach per scenario. */
export function buildScenarioSeed(
  scenario: CoachScenario,
  bootstrap: CoachBootstrap,
  stats: CoachStats,
): string {
  const dueCount = stats.dueCount;
  const lastMod = bootstrap.lastSolvedModuleId
    ? allTopics.find((t) => t.id === bootstrap.lastSolvedModuleId)?.label ?? bootstrap.lastSolvedModuleId
    : null;

  switch (scenario) {
    case 'first_use':
      return (
        '(시나리오: 첫 사용 — 아직 학습 기록이 없음)\n' +
        '친절하게 환영 인사 후, F1~F6 중 어디까지 공부했는지 먼저 물어봐줘. ' +
        '수치 언급은 금지 (아직 없음). 5문장 이내.'
      );
    case 'first_today':
      return (
        '(시나리오: 오늘 첫 접속 — 과거 데이터 있음)\n' +
        `오늘 아직 한 문제도 안 풀었어. DUE ${dueCount}개, ` +
        `약점 모듈 ${stats.weakModules.slice(0, 1).join(', ') || '—'}. ` +
        '오늘 약점 집중 + DUE 처리로 이번 주 목표 달성 가능하다는 톤으로 먼저 말 걸어줘. ' +
        '구체적 추천 2~3개 포함.'
      );
    case 'continuing_today': {
      const acc = bootstrap.lastSolvedModuleCorrectRate ?? 0;
      return (
        '(시나리오: 당일 재진입 — 오늘 이미 학습 중)\n' +
        `오늘 이미 ${bootstrap.todayCount}문제 풀었어. 마지막 모듈: ${bootstrap.lastSolvedModuleId ?? '—'}` +
        `${lastMod ? ' (' + lastMod + ')' : ''}, 그 모듈 정답률 ${acc}%. ` +
        '"아까 풀다 왔죠?" 같은 친근한 톤으로 이어서 할지, 다른 걸 할지 물어봐줘. ' +
        '5문장 이내.'
      );
    }
    case 'returning': {
      const days = bootstrap.daysSinceLastActive ?? 0;
      const weakest = stats.weakModules[0]
        ? (allTopics.find((t) => t.id === stats.weakModules[0])?.label ?? stats.weakModules[0])
        : null;
      return (
        '(시나리오: 며칠 만의 복귀)\n' +
        `${days}일 만이야. DUE ${dueCount}개 쌓였고` +
        `${weakest ? `, ${weakest} 모듈 정답률이 가장 낮아.` : '.'} ` +
        '오랜만이라는 부드러운 인사 + "오늘 30분이면 따라잡을 수 있다"는 회복 톤으로 ' +
        'DUE 먼저 풀기 추천. 5문장 이내.'
      );
    }
  }
}

// ── Session log API ───────────────────────────────────────────
export interface SessionModuleBreakdown {
  moduleId: string;
  total: number;
  correct: number;
}
export interface SessionLog {
  date: string; // YYYY-MM-DD
  totalSolved: number;
  correctRate: number;
  avgSeconds: number;
  moduleBreakdown: SessionModuleBreakdown[];
  coachComment: string;
}

export async function fetchSessionLogs(): Promise<{
  sessions: SessionLog[];
  today: SessionLog | null;
  last: SessionLog | null;
}> {
  const res = await fetch(`${API_URL}/api/session-logs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as {
    sessions: SessionLog[];
    today: SessionLog | null;
    last: SessionLog | null;
  };
}

export async function saveSessionLog(session: SessionLog): Promise<void> {
  const res = await fetch(`${API_URL}/api/session-logs/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Format today's local date as YYYY-MM-DD. */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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
