import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useClaudeStore, { HarryContext, PANEL_WIDTH_DEFAULT } from '../../store/claudeStore';
import useStudyStore from '../../store/studyStore';
import { useClaudeChat, TutorDbContext } from '../../hooks/useClaudeChat';
import { getTopicById } from '../../data/far-topics';
import MessageBubble, { TypingBubble } from './MessageBubble';
import { loadConversation, saveConversation, deleteConversation } from '../../lib/harryHistory';
import type { HarryMessage } from '../../lib/harryHistory';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

// Module-level guard: shared across all ClaudePanel instances to prevent double auto-send
let _autoSentMsg: string | null = null;

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
  const activeBankQuestion = useClaudeStore((s) => s.activeBankQuestion);
  const pendingQuiz = useClaudeStore((s) => s.pendingQuiz);
  const isOpen = useClaudeStore((s) => s.isOpen);
  const pendingAutoMessage = useClaudeStore((s) => s.pendingAutoMessage);
  const setPendingAutoMessage = useClaudeStore((s) => s.setPendingAutoMessage);
  const currentTBSPattern = useClaudeStore((s) => s.currentTBSPattern);
  const harryContext = useClaudeStore((s) => s.harryContext);
  const harryConversationId = useClaudeStore((s) => s.harryConversationId);
  const setHarryContext = useClaudeStore((s) => s.setHarryContext);
  const panelWidth = useClaudeStore((s) => s.panelWidth);
  const setPanelWidth = useClaudeStore((s) => s.setPanelWidth);
  const setHarryConversationId = useClaudeStore((s) => s.setHarryConversationId);
  const setMessages = useClaudeStore((s) => s.setMessages);

  const navigate = useNavigate();
  const location = useLocation();

  const [dbContext, setDbContext] = useState<TutorDbContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const contextFetchedRef = useRef(false);

  // ── Context detection ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let ctx: HarryContext;
    if (currentTBSPattern) {
      ctx = { context_type: 'tbs', context_id: currentTBSPattern.tbs_id, context_name: currentTBSPattern.pattern_name };
    } else if (activeBankQuestion) {
      ctx = { context_type: 'mcq', context_id: activeBankQuestion.questionId, context_name: activeBankQuestion.topicId };
    } else if (analyzeContext) {
      ctx = { context_type: 'mcq', context_id: analyzeContext.topicId ?? 'unknown', context_name: analyzeContext.topicLabel ?? analyzeContext.topicId ?? '분석' };
    } else if (reviewCardContext) {
      ctx = { context_type: 'concept', context_id: reviewCardContext.topicId ?? 'unknown', context_name: reviewCardContext.topicTags[0] ?? reviewCardContext.topicLabel ?? '개념' };
    } else if (location.pathname === '/sprint') {
      const today = new Date().toISOString().split('T')[0];
      ctx = { context_type: 'sprint', context_id: today, context_name: `복습 세션 ${today}` };
    } else if (currentTopicId) {
      ctx = { context_type: 'concept', context_id: currentTopicId, context_name: topic?.label ?? currentTopicId };
    } else {
      ctx = { context_type: 'general', context_id: null, context_name: '일반 대화' };
    }
    setHarryContext(ctx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentTBSPattern?.tbs_id, activeBankQuestion?.questionId, analyzeContext?.topicId, reviewCardContext?.topicId, location.pathname, currentTopicId]);

  // ── Load conversation from DB when context is set ────────────
  useEffect(() => {
    if (!isOpen || !userId || !harryContext) return;
    loadConversation(userId, harryContext.context_type, harryContext.context_id)
      .then((conv) => {
        if (conv && conv.messages.length > 0) {
          setMessages(conv.messages.map((m, i) => ({
            id: `hist-${i}-${m.created_at}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          })));
          setHarryConversationId(conv.id);
        }
      })
      .catch(() => { /* silent */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, harryContext?.context_type, harryContext?.context_id, userId]);

  // ── Fetch personalized DB context once when panel first opens
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
    useClaudeChat(topic?.label, analyzeContext, reviewCardContext, dbContext, dailyGoal, currentTBSPattern);
  const setPendingQuiz = useClaudeStore((s) => s.setPendingQuiz);

  // ── Save conversation (debounced, after assistant responds) ──
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId || !harryContext || isLoading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || !last.content) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const harryMsgs: HarryMessage[] = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content, created_at: new Date(m.timestamp).toISOString() }));
      const id = await saveConversation(userId, harryContext.context_type, harryContext.context_id, harryContext.context_name, harryMsgs);
      if (id) setHarryConversationId(id);
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isLoading]);

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

  // Auto-send sprint review analysis when panel opens with a pending prompt
  useEffect(() => {
    if (!isOpen || !pendingAutoMessage) return;
    if (pendingAutoMessage === _autoSentMsg) return;
    _autoSentMsg = pendingAutoMessage;
    const msg = pendingAutoMessage;
    setPendingAutoMessage(null);
    sendMessage(msg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingAutoMessage]);

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

  const buildGoCommand = (): string => {
    const q = activeBankQuestion;
    if (!q) return '현재 펼쳐진 문제가 없습니다. 스프린트 결과에서 문제를 먼저 펼친 후 /go를 사용해주세요.';
    const optLabels = ['A', 'B', 'C', 'D'];
    const parts: string[] = [];
    parts.push(`[${q.topicId}] 풀이 해설\n`);
    parts.push(`**Q.** ${q.questionText}\n`);
    parts.push(q.options.map((o, i) => `${optLabels[i] ?? i + 1}. ${o}`).join('\n'));
    parts.push(`→ 정답: ${optLabels[q.correctIndex] ?? q.correctIndex}. ${q.options[q.correctIndex]}\n`);
    if (q.explanation) parts.push(`**EXPLANATION**\n${q.explanation}\n`);
    parts.push(`위 문제를 아래 순서로 설명해줘:
1. 문제 한 줄씩 해석 - 형식: [영어 원문 전체] → [한국어 해석]. 반드시 영어 원문 전체를 한 글자도 생략하지 말고 그대로 표시할 것. 요약·축약·"..." 처리 절대 금지.
2. 핵심 질문 해석 (what is asked) - 형식: [영어 원문] → [한국어 해석]
3. 정답 간략 설명
4. 핵심 트리거 키워드 설명
5. 함정(trap) 포인트 설명
6. 실전 단축 풀이법 (30초 안에 푸는 방법)

**반드시 6개 항목 모두 빠짐없이 출력할 것. 어떤 항목도 생략하거나 축약하지 말 것.**`);
    return parts.join('\n');
  };

  const buildQuCommand = (): string => {
    const q = activeBankQuestion;
    if (q) {
      const parts: string[] = [];
      parts.push(`[${q.topicId}] 문제 구조 분석\n`);
      parts.push(`**Q.** ${q.questionText}\n`);
      const optLabels = ['A', 'B', 'C', 'D'];
      parts.push(q.options.map((o, i) => `${optLabels[i] ?? i + 1}. ${o}`).join('\n'));
      parts.push(`→ 정답: ${optLabels[q.correctIndex] ?? q.correctIndex}. ${q.options[q.correctIndex]}\n`);
      if (q.contextBackground) {
        parts.push(`**CONTEXT**\n${q.contextBackground}`);
        if (q.contextTrigger) parts.push(`→ ${q.contextTrigger}`);
      }
      if (q.ruleTitle) {
        parts.push(`\n**RULE: ${q.ruleTitle}**`);
        if (q.ruleItems && q.ruleItems.length > 0) {
          parts.push(q.ruleItems.map(item => `• ${item}`).join('\n'));
        }
      }
      if (q.trigger) parts.push(`\n**TRIGGER**\n${q.trigger}`);
      if (q.trap) parts.push(`\n**TRAP ⚠️**\n${q.trap}`);
      if (q.speed) parts.push(`\n**SPEED**\n${q.speed}`);
      parts.push(`\n위 구조를 기반으로 이 개념을 가르쳐줘. 왜 정답인지, 함정은 무엇인지까지 설명해줘.\nSPEED(30초 풀이법) 섹션은 반드시 **1단계** / **2단계** 형식으로 각 단계를 줄바꿈해서 마크다운 볼드 처리할 것.`);
      return parts.join('\n');
    }
    const eq = reviewCardContext?.exampleQuestion;
    if (!eq) return '현재 펼쳐진 문제가 없습니다. 스프린트 결과에서 문제를 먼저 펼친 후 /qu를 사용해주세요.';
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
    return `[${topicName}] 개념 복습${qLine}

아래 순서대로 분석해줘:

[STEP 1] 이 문제가 뭘 묻는 건지 + 정답 이유
(정답 근거 및 왜 맞는지 한 줄 설명)

[STEP 2] 문제 원문 한 줄씩${reviewCardContext?.questionText ? '' : ' (문제가 없으면 개념 설명으로 대체)'}
→ 한국어 해석
→ 이 문장이 문제에서 하는 역할

[STEP 3]
CONTEXT: 왜 이렇게 처리하는지 경제적 실질
TRIGGER: 이 표현 보이면 이렇게 풀어라
TRAP: 여기서 자주 틀린다
SPEED: 30초 풀이 한 줄`;
  };

  const buildShowMeCommand = (): string => {
    const q = activeBankQuestion;
    if (q) {
      const optLabels = ['A', 'B', 'C', 'D'];
      const parts: string[] = ['show me'];
      parts.push(`\n[현재 문제 컨텍스트 — 이 숫자로 시각화해줘]`);
      parts.push(`Q. ${q.questionText}`);
      parts.push(q.options.map((o, i) => `${optLabels[i] ?? i + 1}. ${o}`).join('\n'));
      parts.push(`정답: ${optLabels[q.correctIndex] ?? q.correctIndex}. ${q.options[q.correctIndex]}`);
      if (q.explanation) parts.push(`해설 핵심: ${q.explanation.slice(0, 300)}`);
      if (q.speed) parts.push(`SPEED: ${q.speed}`);
      return parts.join('\n');
    }
    if (reviewCardContext) {
      const parts: string[] = ['show me'];
      parts.push(`\n[현재 복습 카드 — 이 개념을 시각화해줘]`);
      parts.push(`토픽: ${reviewCardContext.topicTags[0] ?? reviewCardContext.topicId ?? '현재 개념'}`);
      if (reviewCardContext.questionText) parts.push(`문제: ${reviewCardContext.questionText}`);
      if (reviewCardContext.correctAnswer) parts.push(`정답: ${reviewCardContext.correctAnswer}`);
      return parts.join('\n');
    }
    return 'show me';
  };


  const SHOW_ME_TRIGGERS = /^(show me|비주얼로|숫자로 보여줘|비교해줘|구조화해줘)$/i;

  const handleSend = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    const isSlash = t === '/re' || t === '/qu' || t === '/go';
    const isShowMe = SHOW_ME_TRIGGERS.test(t);
    const { text: correctedText, corrected } = (isSlash || isShowMe) ? { text: t, corrected: false } : correctTypos(t);
    const message = t === '/re' ? buildReCommand()
      : t === '/qu' ? buildQuCommand()
      : t === '/go' ? buildGoCommand()
      : isShowMe ? buildShowMeCommand()
      : correctedText;
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
      className={`flex flex-col ${modal ? 'h-full' : 'border-l border-border'}`}
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'transparent' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span>🧙</span>
            <p className="font-semibold text-sm text-[#0f172a]">Harry</p>
            {(isLoading || contextLoading) && <div className="w-3 h-3 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />}
            {contextLoading && <span className="text-[10px] text-[#94a3b8]">학습 현황 로딩 중</span>}
          </div>
          <div className="flex items-center gap-0.5">
            {/* Width presets — desktop only */}
            {!modal && (
              <>
                <button
                  onClick={() => setPanelWidth(680)}
                  title="넓게"
                  className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-muted hover:text-[#1a2744] hover:bg-gray-100 text-[11px] font-semibold"
                  style={{ color: panelWidth >= 600 ? '#1a2744' : undefined }}
                >
                  넓게
                </button>
                <button
                  onClick={() => setPanelWidth(PANEL_WIDTH_DEFAULT)}
                  title="기본"
                  className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-muted hover:text-[#1a2744] hover:bg-gray-100 text-[11px] font-semibold"
                  style={{ color: panelWidth < 600 ? '#1a2744' : undefined }}
                >
                  기본
                </button>
                <div className="hidden md:block w-px h-4 bg-border mx-0.5" />
              </>
            )}
            <button
              onClick={() => { closePanel(); navigate('/harry-history'); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-[#0f172a] hover:bg-gray-100 text-sm"
              title="대화 히스토리"
            >
              🕐
            </button>
            {harryConversationId && (
              <button
                onClick={async () => {
                  if (!harryConversationId) return;
                  await deleteConversation(harryConversationId);
                  setHarryConversationId(null);
                  clearMessages();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-[#ef4444] hover:bg-red-50 text-sm"
                title="이 대화 삭제"
              >
                🗑️
              </button>
            )}
            {messages.length > 0 && !harryConversationId && (
              <button onClick={clearMessages} className="text-[11px] text-muted hover:text-[#0f172a] px-2 py-1 rounded-lg hover:bg-gray-100">초기화</button>
            )}
            <button onClick={closePanel} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-[#0f172a] hover:bg-gray-100 text-xl">×</button>
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
        ) : activeBankQuestion ? (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#faf5ff', color: '#6b21a8' }}>
              📋 스프린트 리뷰:{' '}
              <span className="font-semibold text-[#0f172a]">{activeBankQuestion.topicId}</span>
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
        ) : currentTBSPattern ? (
          <div className="px-3 pb-2">
            <div
              className="px-3 py-2 rounded-lg"
              style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
            >
              <p className="text-[13px] font-medium" style={{ color: '#6b21a8' }}>
                📋 {currentTBSPattern.pattern_name}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#a855f7' }}>
                {currentTBSPattern.tbs_id}
              </p>
            </div>
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
        className="shrink-0 border-t border-border p-3"
        style={{ background: 'transparent', paddingBottom: modal ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 12 }}
      >
        {/* Quick command buttons */}
        <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={autoResize}
            onKeyDown={handleKey}
            placeholder="질문 입력..."
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
