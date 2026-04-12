import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import {
  assembleCoachStats,
  streamCoachResponse,
  CoachStats,
  CoachMsg,
} from '../hooks/useCoach';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function CoachPage() {
  const navigate = useNavigate();
  const userId = useStudyStore((s) => s.userId);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [input, setInput] = useState('');

  const initKickedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message (+ during stream).
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial kickoff: assemble stats + stream the coach's greeting.
  useEffect(() => {
    if (initKickedRef.current) return;
    if (!userId) return;
    initKickedRef.current = true;

    (async () => {
      try {
        const snapshot = await assembleCoachStats(userId);
        setStats(snapshot);
        setInitializing(false);

        const coachId = 'coach-init';
        setMessages([{ id: coachId, role: 'assistant', content: '' }]);
        setIsStreaming(true);
        void streamCoachResponse(
          snapshot,
          [],
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming || !userId) return;
    setInput('');
    setError(null);

    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const asstId = `a-${Date.now()}`;
    const asstMsg: DisplayMessage = { id: asstId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setIsStreaming(true);

    // Build history excluding the empty placeholder we just added.
    const history: CoachMsg[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Re-assemble fresh stats each turn so recent answers are reflected.
    let freshStats: CoachStats = stats!;
    try {
      freshStats = await assembleCoachStats(userId);
      setStats(freshStats);
    } catch {
      // fall back to cached stats
    }

    void streamCoachResponse(
      freshStats,
      history,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: m.content + chunk } : m)),
        );
      },
      () => setIsStreaming(false),
      (err) => {
        setError(err);
        setIsStreaming(false);
      },
    );
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const goQuizForWeakModule = () => {
    const w = stats?.weakModules[0];
    if (w) navigate(`/quiz?topicId=${w}`);
    else navigate('/quiz?mode=weak');
  };

  const strongLabel = stats?.strongModules[0]
    ? allTopics.find((t) => t.id === stats.strongModules[0])?.label ?? stats.strongModules[0]
    : null;
  const weakLabel = stats?.weakModules[0]
    ? allTopics.find((t) => t.id === stats.weakModules[0])?.label ?? stats.weakModules[0]
    : null;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">🤖 AI 코치</h1>
          <p className="text-xs text-muted mt-0.5">
            학습 데이터를 바탕으로 오늘 뭘 할지 제안해드려요
          </p>
        </div>

        {/* Stats snapshot strip */}
        {stats && (
          <div className="card p-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="text-muted">📊</span>
            <span>
              총 <strong className="text-[#0f172a]">{stats.totalSolved}</strong>문제
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

        {/* Messages */}
        <div
          className="card p-4 flex flex-col gap-2"
          style={{ minHeight: 360 }}
        >
          {initializing && messages.length === 0 && (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted">학습 데이터 분석 중...</p>
            </div>
          )}
          {messages.map((m, i) => {
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

        {/* Quick-action chips */}
        <div className="flex flex-wrap gap-1.5">
          {stats && stats.weakModules.length > 0 && (
            <button
              onClick={goQuizForWeakModule}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
            >
              🎯 약점 모듈 풀기
            </button>
          )}
          {stats && stats.dueCount > 0 && (
            <button
              onClick={() => navigate('/quiz?mode=due')}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}
            >
              📅 DUE {stats.dueCount}개 복습
            </button>
          )}
          <button
            onClick={() => navigate('/quiz?mode=interleave')}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca' }}
          >
            🔀 전체 퀴즈
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            📊 현황 상세
          </button>
        </div>

        {/* Input */}
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
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || initializing}
            className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: '#4f6ef7' }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline coach message bubble ─────────────────────────────────
// Independent from the Claude tutor's MessageBubble to avoid coupling
// with claudeStore. Renders markdown normally and shows a blinking
// cursor only during the live stream of the last assistant message.
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
