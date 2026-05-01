import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import useClaudeStore from '../../store/claudeStore';
import useStudyStore from '../../store/studyStore';
import { useClaudeChat, TutorDbContext } from '../../hooks/useClaudeChat';
import { fetchRelatedExtractions } from '../../lib/db';
import { getTopicById } from '../../data/far-topics';
import MessageBubble, { TypingBubble } from './MessageBubble';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const BOUNCE_CSS = `@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`;
if (typeof document !== 'undefined' && !document.getElementById('claude-bounce')) {
  const s = document.createElement('style'); s.id = 'claude-bounce'; s.textContent = BOUNCE_CSS; document.head.appendChild(s);
}

// ── Korean typo correction (client-side, no API) ───────────────
const TYPO_RULES: [RegExp, string][] = [
  [/안되요/g, '안돼요'],
  [/\b되요\b/g, '돼요'],
  [/설명해져/g, '설명해줘'],
  [/알랴줘/g, '알려줘'],
  [/가르켜/g, '가르쳐'],
  [/가르키/g, '가르치'],
  [/왠만하면/g, '웬만하면'],
  [/뭐에요\b/g, '뭐예요'],
]

function correctTypos(text: string): { text: string; corrected: boolean } {
  let result = text;
  for (const [pattern, replacement] of TYPO_RULES) {
    result = result.replace(pattern, replacement);
  }
  return { text: result, corrected: result !== text };
}

interface ClaudePanelProps {
  modal?: boolean;
}

export default function ClaudePanel({ modal }: ClaudePanelProps) {
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const userId = useStudyStore((s) => s.userId);
  const dailyGoal = useStudyStore((s) => s.dailyGoal);
  const topic = currentTopicId ? getTopicById(currentTopicId) : null;
  const analyzeContext = useClaudeStore((s) => s.analyzeContext);
  const reviewCardContext = useClaudeStore((s) => s.reviewCardContext);
  const pendingQuiz = useClaudeStore((s) => s.pendingQuiz);
  const isOpen = useClaudeStore((s) => s.isOpen);

  const [dbContext, setDbContext] = useState<TutorDbContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const contextFetchedRef = useRef(false);

  // Fetch personalized DB context once when panel first opens
  useEffect(() => {
    if (!isOpen || !userId || contextFetchedRef.current) return;
    contextFetchedRef.current = true;
    setContextLoading(true);
    fetch(`${API_URL}/api/tutor/context?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json() as Promise<{ available: boolean } & Partial<TutorDbContext>>)
      .then((data) => { if (data.available) setDbContext(data as TutorDbContext); })
      .catch(() => { /* silent fail — tutor works without DB context */ })
      .finally(() => setContextLoading(false));
  }, [isOpen, userId]);

  const { messages, isLoading, closePanel, sendMessage, sendStarter, clearMessages } =
    useClaudeChat(topic?.label, analyzeContext, reviewCardContext, dbContext, dailyGoal);
  const setPendingQuiz = useClaudeStore((s) => s.setPendingQuiz);

  const [input, setInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);   // user intent: follow bottom?
  const isProgrammaticRef = useRef(false);    // suppress scroll events from our own scrollTo

  useEffect(() => { if (isOpen) setTimeout(() => taRef.current?.focus(), 300); }, [isOpen]);

  const scrollToBottom = () => {
    const el = msgsRef.current;
    if (!el) return;
    isProgrammaticRef.current = true;
    el.scrollTo({ top: el.scrollHeight });
  };

  // When user sends — always snap to bottom and re-enable auto-scroll
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      shouldAutoScrollRef.current = true;
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // During streaming — follow only if user hasn't scrolled up
  useEffect(() => {
    if (!isLoading) return;
    if (shouldAutoScrollRef.current) scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleMsgsScroll = () => {
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }
    const el = msgsRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    shouldAutoScrollRef.current = atBottom;
    setIsAtBottom(atBottom);
  };

  const SLASH_COMMANDS: Record<string, string> = {
    '/go': `현재 문제를 아래 순서로 설명해줘:
1. 문제 한 줄씩 해석 - 형식: [영어 원문 전체] → [한국어 해석]. 반드시 영어 원문 전체를 한 글자도 생략하지 말고 그대로 표시할 것. 요약·축약·"..." 처리 절대 금지.
2. 핵심 질문 해석 (what is asked) - 형식: [영어 원문] → [한국어 해석]
3. 정답 간략 설명
4. 핵심 트리거 키워드 설명
5. 함정(trap) 포인트 설명
6. 실전 단축 풀이법 (30초 안에 푸는 방법)

**반드시 6개 항목 모두 빠짐없이 출력할 것. 어떤 항목도 생략하거나 축약하지 말 것.**`,
  };

  const buildQuCommand = (): string => {
    const eq = reviewCardContext?.exampleQuestion;
    if (!eq) return '현재 복습 카드에 예시 문제 데이터가 없습니다. (/qu 사용 불가)';
    const optLines = eq.options.join('\n');
    const expl = typeof eq.explanation === 'string'
      ? eq.explanation
      : [
          eq.explanation.core,
          eq.explanation.calculation ? `계산: ${eq.explanation.calculation}` : null,
          eq.explanation.traps.length > 0 ? `오답 해설:\n${eq.explanation.traps.join('\n')}` : null,
          eq.explanation.memory ? `기억 포인트: ${eq.explanation.memory}` : null,
        ].filter(Boolean).join('\n');
    return `문제: ${eq.question}\n${optLines}\n정답: ${eq.answer}\n해설: ${expl}\n\n위 문제 기준으로 설명해줘`;
  };

  const buildReCommand = (): string => {
    const topicName =
      reviewCardContext?.topicTags[0] ??
      reviewCardContext?.topicLabel ??
      reviewCardContext?.topicId ??
      '현재 개념';
    const qLine = reviewCardContext?.questionText
      ? `\n문제: ${reviewCardContext.questionText}\n정답: ${reviewCardContext.correctAnswer ?? '(미입력)'}`
      : '';
    return `[STRUCTURED OUTPUT REQUIRED]
[${topicName}] 개념에 대해 반드시 아래 5개 항목을 번호 순서대로 모두 출력해줘.
항목을 생략하거나 자유 형식으로 바꾸지 말 것.${qLine}

1. 개념 한 줄 요약 (핵심만)
2. 왜 헷갈리는가 (함정 구조 설명)
3. 정답 근거 (rule 또는 기준)
4. 오답 선지 해설 (각 오답이 왜 틀렸는지)
5. 기억 트리거 (30초 안에 떠올릴 수 있는 키워드/이미지)`;
  };

  const handleKbCommand = async () => {
    const topicId = reviewCardContext?.topicId ?? null;
    const topicLabel = reviewCardContext?.topicTags[0] ?? reviewCardContext?.topicLabel ?? topicId ?? '현재 토픽';
    useClaudeStore.getState().addMessage({ role: 'user', content: '/kb' });
    if (!userId || !topicId) {
      useClaudeStore.getState().addMessage({ role: 'assistant', content: '복습 탭에서 카드를 먼저 선택한 후 /kb를 사용해주세요.' });
      return;
    }
    const items = await fetchRelatedExtractions(userId, topicId, '', 20);
    if (items.length === 0) {
      useClaudeStore.getState().addMessage({ role: 'assistant', content: `**${topicLabel}** 관련 분석 기록이 없어요.` });
      return;
    }
    const seen = new Set<string>();
    const conceptList: string[] = [];
    for (const item of items) {
      for (const c of item.concepts) {
        if (!seen.has(c)) { seen.add(c); conceptList.push(c); }
      }
    }
    const lines = [`**📚 ${topicLabel} 개념 모음** (분석 ${items.length}개 기준)\n`];
    conceptList.slice(0, 20).forEach((c) => lines.push(`- ${c}`));
    useClaudeStore.getState().addMessage({ role: 'assistant', content: lines.join('\n') });
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    if (t === '/kb') {
      setInput('');
      if (taRef.current) taRef.current.style.height = 'auto';
      handleKbCommand();
      return;
    }
    if (t === '/en') {
      setInput('');
      if (taRef.current) taRef.current.style.height = 'auto';
      const lastScript = useClaudeStore.getState().lastTtsScript;
      if (!lastScript) {
        useClaudeStore.getState().addMessage({ role: 'user', content: '/en' });
        useClaudeStore.getState().addMessage({ role: 'assistant', content: '🔊 먼저 팟캐스트를 재생한 후 /en을 사용해주세요.' });
        return;
      }
      sendMessage(`/en — 아래 팟캐스트 스크립트를 한국어로 해설해줘:\n\n${lastScript}`);
      return;
    }
    const isSlash = t === '/re' || t === '/qu' || t in SLASH_COMMANDS;
    const { text: correctedText, corrected } = isSlash ? { text: t, corrected: false } : correctTypos(t);
    const message = t === '/re' ? buildReCommand() : t === '/qu' ? buildQuCommand() : (SLASH_COMMANDS[t] ?? correctedText);
    sendMessage(message, corrected);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    handleSend();
  };

  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const lastMsg = messages[messages.length - 1];
  const showTyping = isLoading && (!lastMsg || lastMsg.role === 'user' || (lastMsg.role === 'assistant' && !lastMsg.content));
  const isEmpty = messages.length === 0;

  const handleStarter = (kind: 'explain' | 'concept' | 'critique') => {
    if (!pendingQuiz || isLoading) return;
    sendStarter(kind, pendingQuiz);
    setPendingQuiz(null);
  };

  return (
    <div
      className={`flex flex-col bg-white ${modal ? 'h-full' : 'border-l border-border'}`}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span>💬</span>
            <p className="font-semibold text-sm text-[#0f172a]">Claude 튜터</p>
            {(isLoading || contextLoading) && <div className="w-3 h-3 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />}
            {contextLoading && <span className="text-[10px] text-[#94a3b8]">학습 현황 로딩 중</span>}
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearMessages} className="text-[11px] text-muted hover:text-[#0f172a] px-2 py-1 rounded-lg hover:bg-gray-100">초기화</button>
            )}
            <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-[#0f172a] hover:bg-gray-100 text-xl">×</button>
          </div>
        </div>
        {analyzeContext ? (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#eef2ff', color: '#3730a3' }}>
              현재 문제:{' '}
              <span className="font-semibold">
                {analyzeContext.topicId
                  ? `${analyzeContext.topicId}${analyzeContext.topicLabel ? ` · ${analyzeContext.topicLabel}` : ''}`
                  : '분석 중'}
              </span>
            </span>
          </div>
        ) : reviewCardContext ? (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#f0fdf4', color: '#166534' }}>
              복습 중:{' '}
              <span className="font-semibold text-[#0f172a]">
                {reviewCardContext.topicTags[0] ?? reviewCardContext.topicId ?? '개념 카드'}
              </span>
            </span>
          </div>
        ) : topic ? (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#f0f4f8', color: '#64748b' }}>
              현재 토픽: <span className="font-semibold text-[#0f172a]">{topic.label}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 relative">
      <div ref={msgsRef} onScroll={handleMsgsScroll} className="absolute inset-0 overflow-y-auto px-3 py-4">
        {isEmpty && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#eef2ff' }}>👋</div>
            <div>
              <p className="font-semibold text-sm text-[#0f172a] mb-1">
                {pendingQuiz
                  ? '이 문제로 무엇을 도와드릴까요?'
                  : reviewCardContext?.topicTags[0]
                  ? `${reviewCardContext.topicTags[0]} 복습 중이시네요.`
                  : '안녕하세요!'}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {pendingQuiz
                  ? '아래에서 선택하거나 직접 질문해주세요.'
                  : reviewCardContext
                  ? '궁금한 점을 바로 물어보세요!'
                  : '토픽에 대해 무엇이든 물어보세요.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) =>
              msg.role === 'assistant' && !msg.content ? null : (
                <MessageBubble key={msg.id} message={msg} />
              ),
            )}
            {showTyping && <TypingBubble />}
          </div>
        )}
      </div>
      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full shadow-md z-10 transition-opacity"
          style={{ background: '#4f6ef7', color: 'white', opacity: 0.9 }}
          title="최하단으로 이동"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
      </div>

      {/* Short Starter buttons — shown when a quiz context is pending and chat is empty */}
      {pendingQuiz && isEmpty && !isLoading && (
        <div className="shrink-0 px-3 pb-2 flex flex-wrap gap-1.5">
          {[
            { k: 'explain' as const, label: '📘 문제 해설 풀이' },
            { k: 'concept' as const, label: '💡 주요 개념 정리' },
            { k: 'critique' as const, label: '🤔 문제 제기하기' },
          ].map((b) => (
            <button
              key={b.k}
              onClick={() => handleStarter(b.k)}
              className="text-xs px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca' }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="shrink-0 border-t border-border p-3 bg-white"
        style={{ paddingBottom: modal ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 12 }}
      >
        <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={autoResize}
            onKeyDown={handleKey}
            placeholder="질문 입력… /re /qu /go /kb /en"
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#0f172a] resize-none outline-none placeholder:text-muted leading-relaxed disabled:opacity-50"
            style={{ minHeight: 22, maxHeight: 120 }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40" style={{ background: '#4f6ef7' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted mt-1.5 text-center hidden md:block">Shift+Enter 줄바꿈 · Enter 전송</p>
      </div>
    </div>
  );
}
