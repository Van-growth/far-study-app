import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import {
  assembleCoachStats,
  streamCoachResponse,
  loadCoachContext,
  buildScenarioSeed,
  saveSessionLog,
  todayStr,
  detectScenario,
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

  // ── Initial kickoff ────────────────────────────────────────
  useEffect(() => {
    if (initKickedRef.current) return;
    if (!userId) return;
    initKickedRef.current = true;

    (async () => {
      try {
        const ctx = await loadCoachContext(userId);
        setStats(ctx.stats);
        setBootstrap(ctx.bootstrap);
        setScenario(ctx.scenario);
        setInitializing(false);

        const seed = buildScenarioSeed(ctx.scenario, ctx.bootstrap, ctx.stats);
        const coachId = 'coach-init';
        setMessages([{ id: coachId, role: 'assistant', content: '' }]);
        setIsStreaming(true);
        void streamCoachResponse(
          ctx.stats,
          // Single synthetic user message with scenario context — the server
          // treats this as the opening turn and the coach replies with a
          // scenario-appropriate greeting.
          [{ role: 'user', content: seed }],
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === coachId ? { ...m, content: m.content + chunk } : m)),
            );
          },
          () => setIsStreaming(false),
          (err) => {
            setError(err);
            setIsStreaming(false);
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'init failed');
        setInitializing(false);
      }
    })();
  }, [userId]);

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

    let freshStats: CoachStats = stats!;
    try {
      freshStats = await assembleCoachStats(userId);
      setStats(freshStats);
    } catch {/* use cached */}
    let freshBootstrap: CoachBootstrap | null = bootstrap;
    try {
      const ctx = await loadCoachContext(userId);
      freshBootstrap = ctx.bootstrap;
      setBootstrap(ctx.bootstrap);
      setScenario(ctx.scenario);
    } catch {/* use cached */}

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
          // After the wrap-up reply finishes streaming, persist it.
          persistSessionFromStream(asstId, freshBootstrap);
        }
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

// Silence unused-var warnings for helpers that aren't referenced yet.
void detectScenario;
