import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import {
  streamCoachResponse,
  loadCoachContext,
  buildScenarioSeed,
  saveSessionLog,
  todayStr,
  CoachStats,
  CoachBootstrap,
  CoachScenario,
  CoachMsg,
  SessionLog,
} from '../hooks/useCoach';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ─────────────────────────────────────────────────────────────
// Module-level cache — survives CoachPage remounts (SPA tab switches).
// Invalidated when:
//   · userId changes (login/logout)
//   · local day rolls over (YYYY-MM-DD boundary)
//   · user clicks the explicit refresh button
// ─────────────────────────────────────────────────────────────
interface CoachCache {
  userId: string;
  date: string; // YYYY-MM-DD — invalidates automatically at midnight
  stats: CoachStats;
  bootstrap: CoachBootstrap;
  scenario: CoachScenario;
  messages: DisplayMessage[];
}
let MODULE_CACHE: CoachCache | null = null;

function isCacheValid(userId: string, day: string): boolean {
  if (!MODULE_CACHE) return false;
  if (MODULE_CACHE.userId !== userId) return false;
  if (MODULE_CACHE.date !== day) return false;
  return true;
}

function writeCache(
  userId: string,
  stats: CoachStats,
  bootstrap: CoachBootstrap,
  scenario: CoachScenario,
  messages: DisplayMessage[],
) {
  MODULE_CACHE = {
    userId,
    date: todayStr(),
    stats,
    bootstrap,
    scenario,
    messages,
  };
}

export function clearCoachCache() {
  MODULE_CACHE = null;
}

interface ActionChip {
  label: string;
  emoji?: string;
  onClick: () => void;
  tone: 'primary' | 'warn' | 'neutral' | 'danger';
}

const TONE_STYLE: Record<ActionChip['tone'], { bg: string; border: string; color: string }> = {
  primary: { bg: '#eef2ff', border: '#c7d2fe', color: '#4338ca' },
  warn: { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
  danger: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  neutral: { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' },
};

export default function CoachPage() {
  const navigate = useNavigate();
  const userId = useStudyStore((s) => s.userId);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [bootstrap, setBootstrap] = useState<CoachBootstrap | null>(null);
  const [scenario, setScenario] = useState<CoachScenario | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [input, setInput] = useState('');
  const [lastCoachContent, setLastCoachContent] = useState<string>('');
  const [wrappingUp, setWrappingUp] = useState(false);

  const initKickedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wrappedSessionSavedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch + stream the initial greeting. Used by the mount effect AND by
  // the manual refresh button. Writes the result into MODULE_CACHE so
  // subsequent mounts hydrate from memory without an API call.
  //
  // Hardened against hanging Supabase calls:
  //  · 8s timeout on loadCoachContext — if it doesn't settle we fall back
  //    to empty stats + first_use scenario instead of retrying.
  //  · Single attempt, no retry loop. On hard failure the coach still
  //    greets the user with "first user" branch so they can start typing.
  const runInitialFetch = async (uid: string) => {
    const emptyStats: CoachStats = {
      totalSolved: 0,
      lastActive: null,
      dueCount: 0,
      moduleStats: [],
      recentWrong: [],
      strongModules: [],
      weakModules: [],
    };
    const emptyBootstrap: CoachBootstrap = {
      totalSolved: 0,
      lastActive: null,
      daysSinceLastActive: null,
      todayCount: 0,
      todayCorrect: 0,
      todayAvgSeconds: null,
      todayBreakdown: [],
      lastSolvedModuleId: null,
      lastSolvedModuleCorrectRate: null,
    };

    // Race the context load against a timeout. On failure/timeout we
    // intentionally DO NOT retry — the coach page continues with the
    // empty-data "first_use" branch so the user is never stuck.
    let ctx: { stats: CoachStats; bootstrap: CoachBootstrap; scenario: CoachScenario };
    try {
      ctx = await Promise.race([
        loadCoachContext(uid),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout after 8s')), 8000),
        ),
      ]);
    } catch (e) {
      console.warn(
        '[CoachPage] loadCoachContext failed — falling back to empty data (first_use):',
        e instanceof Error ? e.message : e,
      );
      ctx = { stats: emptyStats, bootstrap: emptyBootstrap, scenario: 'first_use' };
      setError('학습 데이터를 불러오지 못해 기본 화면으로 시작합니다.');
    }

    try {
      setStats(ctx.stats);
      setBootstrap(ctx.bootstrap);
      setScenario(ctx.scenario);
      setInitializing(false);

      const seed = buildScenarioSeed(ctx.scenario, ctx.bootstrap, ctx.stats);
      const coachId = 'coach-init';
      const seedMessages: DisplayMessage[] = [
        { id: coachId, role: 'assistant', content: '' },
      ];
      setMessages(seedMessages);
      // Pre-warm cache so a rapid tab-switch mid-stream finds something.
      writeCache(uid, ctx.stats, ctx.bootstrap, ctx.scenario, seedMessages);

      setIsStreaming(true);
      void streamCoachResponse(
        ctx.stats,
        [{ role: 'user', content: seed }],
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === coachId ? { ...m, content: m.content + chunk } : m)),
          );
        },
        () => {
          setIsStreaming(false);
          // Final commit: store the fully-streamed message list.
          setMessages((prev) => {
            writeCache(uid, ctx.stats, ctx.bootstrap, ctx.scenario, prev);
            return prev;
          });
        },
        (err) => {
          setError(err);
          setIsStreaming(false);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'init failed');
      setInitializing(false);
    }
  };

  // ── Initial kickoff (with cache) ──────────────────────────
  // 1. Hard single-fire guard via ref — survives React 18 StrictMode double-invoke
  // 2. Module cache hydration — survives tab-switch remounts
  // 3. Fresh fetch only on cache miss (new user / new day / first ever)
  useEffect(() => {
    if (initKickedRef.current) return;
    if (!userId) return;
    initKickedRef.current = true;

    const day = todayStr();

    // Cache hit — hydrate state from memory, no API call.
    if (isCacheValid(userId, day) && MODULE_CACHE) {
      const c = MODULE_CACHE;
      setStats(c.stats);
      setBootstrap(c.bootstrap);
      setScenario(c.scenario);
      setMessages(c.messages);
      setInitializing(false);
      return;
    }

    // Cache miss — fetch and stream once.
    void runInitialFetch(userId);
    // Deps: userId only. The ref guard + cache check ensure this body runs
    // at most once per (userId, day) combination, even across remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Manual refresh — explicit user action, clears cache + re-fetches.
  const handleRefresh = () => {
    if (isStreaming || !userId) return;
    clearCoachCache();
    setMessages([]);
    setStats(null);
    setBootstrap(null);
    setScenario(null);
    setInitializing(true);
    setError(null);
    void runInitialFetch(userId);
  };

  // Track the latest assistant content so "wrap up save" can read it.
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) setLastCoachContent(lastAssistant.content);
  }, [messages]);

  // ── Send user message ─────────────────────────────────────
  const sendUserMessage = async (text: string, opts?: { wrapup?: boolean }) => {
    if (!text.trim() || isStreaming || !userId) return;
    setError(null);

    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const asstId = `a-${Date.now()}`;
    const asstMsg: DisplayMessage = { id: asstId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setIsStreaming(true);
    if (opts?.wrapup) setWrappingUp(true);

    const history: CoachMsg[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // One combined fetch (previously called BOTH assembleCoachStats and
    // loadCoachContext, duplicating the stats query every turn).
    let freshStats: CoachStats = stats!;
    let freshBootstrap: CoachBootstrap | null = bootstrap;
    let freshScenario: CoachScenario | null = scenario;
    try {
      const ctx = await loadCoachContext(userId);
      freshStats = ctx.stats;
      freshBootstrap = ctx.bootstrap;
      freshScenario = ctx.scenario;
      setStats(ctx.stats);
      setBootstrap(ctx.bootstrap);
      setScenario(ctx.scenario);
    } catch {
      // use cached context; stream still proceeds
    }

    void streamCoachResponse(
      freshStats,
      history,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: m.content + chunk } : m)),
        );
      },
      () => {
        setIsStreaming(false);
        if (opts?.wrapup && freshBootstrap) {
          persistSessionFromStream(asstId, freshBootstrap);
        }
        // Update cache with the fully-streamed turn so tab switches retain it.
        setMessages((prev) => {
          if (userId && freshBootstrap && freshScenario) {
            writeCache(userId, freshStats, freshBootstrap, freshScenario, prev);
          }
          return prev;
        });
      },
      (err) => {
        setError(err);
        setIsStreaming(false);
        setWrappingUp(false);
      },
    );
  };

  // Read the final assistant content off the state and POST to session-logs.
  const persistSessionFromStream = (assistantId: string, b: CoachBootstrap) => {
    // Defer a tick so React flushes the final chunk.
    setTimeout(() => {
      setMessages((prev) => {
        const last = prev.find((m) => m.id === assistantId);
        const comment = last?.content ?? '';
        const correctRate =
          b.todayCount > 0 ? Math.round((b.todayCorrect / b.todayCount) * 100) : 0;
        const session: SessionLog = {
          date: todayStr(),
          totalSolved: b.todayCount,
          correctRate,
          avgSeconds: b.todayAvgSeconds ?? 0,
          moduleBreakdown: b.todayBreakdown.map((m) => ({
            moduleId: m.moduleId,
            total: m.total,
            correct: m.correct,
          })),
          coachComment: comment,
        };
        if (!wrappedSessionSavedRef.current) {
          wrappedSessionSavedRef.current = true;
          saveSessionLog(session).catch(() => {/* background */});
        }
        setWrappingUp(false);
        return prev;
      });
    }, 50);
  };

  const handleSendInput = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendUserMessage(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendInput();
    }
  };

  const handleWrapUp = () => {
    if (wrappingUp || !bootstrap) return;
    if (bootstrap.todayCount === 0) {
      setError('오늘 아직 푼 문제가 없어요. 한 문제라도 풀고 마무리해주세요.');
      return;
    }
    const correctRate = Math.round((bootstrap.todayCorrect / bootstrap.todayCount) * 100);
    const breakdown = bootstrap.todayBreakdown
      .map((m) => `${m.moduleId} ${Math.round((m.correct / m.total) * 100)}% (${m.correct}/${m.total})`)
      .join(', ');
    const msg =
      `오늘 학습 마무리 해줘.\n` +
      `오늘 총 ${bootstrap.todayCount}문제 풀었고 정답률 ${correctRate}%, ` +
      `평균 ${bootstrap.todayAvgSeconds ?? '—'}초.\n` +
      `모듈별: ${breakdown}\n` +
      `틀린 문제 위주로 분석 + 내일 할 것 1~2개 구체적으로 짚어줘.`;
    wrappedSessionSavedRef.current = false;
    sendUserMessage(msg, { wrapup: true });
  };

  // ── Scenario-specific quick actions ───────────────────────
  const actions = useMemo<ActionChip[]>(() => {
    if (!stats || !bootstrap || !scenario) return [];
    const chips: ActionChip[] = [];
    const weakest = stats.weakModules[0];
    const weakestLabel = weakest
      ? allTopics.find((t) => t.id === weakest)?.label ?? weakest
      : null;
    const lastMod = bootstrap.lastSolvedModuleId;
    const lastModLabel = lastMod
      ? allTopics.find((t) => t.id === lastMod)?.label ?? lastMod
      : null;

    switch (scenario) {
      case 'first_use':
        // no structured chips — user types their starting point
        break;
      case 'first_today':
        if (weakest)
          chips.push({
            label: `→ ${weakestLabel} 퀴즈 시작`,
            onClick: () => navigate(`/quiz?moduleId=${weakest}`),
            tone: 'danger',
          });
        if (stats.dueCount > 0)
          chips.push({
            label: `→ DUE ${stats.dueCount}개 복습`,
            onClick: () => navigate('/quiz?mode=due'),
            tone: 'warn',
          });
        chips.push({
          label: '→ 전체 퀴즈 (Interleaving)',
          onClick: () => navigate('/quiz?mode=interleave'),
          tone: 'primary',
        });
        break;
      case 'continuing_today':
        if (lastMod)
          chips.push({
            label: `→ ${lastModLabel} 이어서 풀기`,
            onClick: () => navigate(`/quiz?moduleId=${lastMod}`),
            tone: 'primary',
          });
        chips.push({
          label: '→ 다른 거 할래요?',
          onClick: () => taRef.current?.focus(),
          tone: 'neutral',
        });
        break;
      case 'returning':
        if (stats.dueCount > 0)
          chips.push({
            label: `→ DUE ${stats.dueCount}개 먼저 풀기`,
            onClick: () => navigate('/quiz?mode=due'),
            tone: 'warn',
          });
        if (weakest)
          chips.push({
            label: `→ ${weakestLabel} 집중`,
            onClick: () => navigate(`/quiz?moduleId=${weakest}`),
            tone: 'danger',
          });
        break;
    }
    return chips;
  }, [stats, bootstrap, scenario, navigate]);

  const strongLabel = stats?.strongModules[0]
    ? allTopics.find((t) => t.id === stats.strongModules[0])?.label ?? stats.strongModules[0]
    : null;
  const weakLabel = stats?.weakModules[0]
    ? allTopics.find((t) => t.id === stats.weakModules[0])?.label ?? stats.weakModules[0]
    : null;

  const canWrapUp =
    bootstrap !== null && bootstrap.todayCount > 0 && !isStreaming && !wrappingUp;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">🤖 AI 코치</h1>
            <p className="text-xs text-muted mt-0.5">
              학습 데이터를 바탕으로 오늘 뭘 할지 제안해드려요
              {scenario && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-[#4f6ef7]">
                  {scenarioLabel(scenario)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isStreaming || initializing}
            title="학습 데이터 새로고침 (캐시 무시)"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs text-muted hover:text-[#0f172a] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ↻
          </button>
        </div>

        {stats && (
          <div className="card p-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-muted">📊</span>
            <span>
              총 <strong className="text-[#0f172a]">{stats.totalSolved}</strong>문제
            </span>
            <span className="text-muted">·</span>
            <span>
              오늘{' '}
              <strong className="text-[#0f172a]">{bootstrap?.todayCount ?? 0}</strong>문제
            </span>
            <span className="text-muted">·</span>
            <span>
              DUE{' '}
              <strong style={{ color: stats.dueCount > 0 ? '#ef4444' : '#64748b' }}>
                {stats.dueCount}
              </strong>
            </span>
            <span className="text-muted">·</span>
            <span>
              강점 <strong className="text-[#22c55e]">{stats.strongModules.length}</strong>
            </span>
            <span className="text-muted">·</span>
            <span>
              약점 <strong className="text-[#ef4444]">{stats.weakModules.length}</strong>
            </span>
            {strongLabel && (
              <span className="text-[10px] text-muted ml-auto truncate max-w-[40%]">
                💪 {strongLabel}
              </span>
            )}
            {weakLabel && (
              <span className="text-[10px] text-muted truncate max-w-[40%]">🎯 {weakLabel}</span>
            )}
          </div>
        )}

        <div className="card p-4 flex flex-col gap-2" style={{ minHeight: 360 }}>
          {initializing && messages.length === 0 && (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted">학습 데이터 분석 중...</p>
            </div>
          )}
          {messages.map((m, i) => {
            // Hide the synthetic seed user messages — they're internal context,
            // not something the student typed. We detect them by the leading
            // "(시나리오:" tag or "오늘 학습 마무리 해줘." prefix the wrap-up uses.
            if (
              m.role === 'user' &&
              (m.content.startsWith('(시나리오:') || m.content.startsWith('오늘 학습 마무리 해줘'))
            ) {
              return null;
            }
            const isLast = i === messages.length - 1;
            const isStreamingThis = isLast && isStreaming && m.role === 'assistant';
            return <CoachBubble key={m.id} message={m} streaming={isStreamingThis} />;
          })}
          <div ref={endRef} />
        </div>

        {error && (
          <div
            className="p-2 rounded text-xs text-[#991b1b]"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            ⚠️ {error}
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((a, i) => {
              const s = TONE_STYLE[a.tone];
              return (
                <button
                  key={i}
                  onClick={a.onClick}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        )}

        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ border: '1.5px solid #e2e8f0', background: 'white' }}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="코치에게 질문하거나 계획을 요청하세요..."
            disabled={isStreaming || initializing}
            rows={2}
            className="flex-1 bg-transparent text-sm text-[#0f172a] resize-none outline-none placeholder:text-muted leading-relaxed disabled:opacity-50"
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button
            onClick={handleSendInput}
            disabled={!input.trim() || isStreaming || initializing}
            className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: '#4f6ef7' }}
          >
            전송
          </button>
        </div>

        {/* Wrap-up button — fixed to bottom of the page flow */}
        <button
          onClick={handleWrapUp}
          disabled={!canWrapUp}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{
            background: canWrapUp ? '#f0fdf4' : '#f1f5f9',
            border: `1.5px solid ${canWrapUp ? '#86efac' : '#e2e8f0'}`,
            color: canWrapUp ? '#166534' : '#94a3b8',
          }}
        >
          {wrappingUp ? '🤖 리캡 생성 중...' : '오늘 마무리 ✓'}
        </button>
      </div>
    </div>
  );
}

function scenarioLabel(s: CoachScenario): string {
  switch (s) {
    case 'first_use': return '첫 사용';
    case 'first_today': return '오늘 첫 접속';
    case 'continuing_today': return '당일 재진입';
    case 'returning': return '복귀';
  }
}

// ── Inline coach bubble (unchanged from prior version) ────────
function CoachBubble({
  message,
  streaming,
}: {
  message: DisplayMessage;
  streaming: boolean;
}) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: '#4f6ef7' }}
        >
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
        style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
      >
        🤖
      </div>
      <div
        className="max-w-[90%] px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
      >
        {streaming ? (
          <div className="text-sm leading-relaxed text-[#0f172a] whitespace-pre-wrap">
            {message.content}
            <span className="inline-block w-1.5 h-4 bg-[#4f6ef7] ml-0.5 animate-pulse align-text-bottom rounded-sm" />
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-[#0f172a]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#0f172a]">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ml-5 my-1 flex flex-col gap-0.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-5 my-1 flex flex-col gap-0.5">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 rounded text-[11px] font-mono bg-gray-100">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

