import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import useClaudeStore from '../../store/claudeStore';
import useStudyStore from '../../store/studyStore';
import { useClaudeChat } from '../../hooks/useClaudeChat';
import { getTopicById } from '../../data/far-topics';
import MessageBubble, { TypingBubble } from './MessageBubble';
import QuickActions from './QuickActions';

const BOUNCE_CSS = `@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`;
if (typeof document !== 'undefined' && !document.getElementById('claude-bounce')) {
  const s = document.createElement('style'); s.id = 'claude-bounce'; s.textContent = BOUNCE_CSS; document.head.appendChild(s);
}

interface ClaudePanelProps {
  modal?: boolean;
}

export default function ClaudePanel({ modal }: ClaudePanelProps) {
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const topic = currentTopicId ? getTopicById(currentTopicId) : null;

  const { messages, isLoading, closePanel, sendMessage, sendQuickAction, clearMessages } =
    useClaudeChat(topic?.label);

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isOpen = useClaudeStore((s) => s.isOpen);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) setTimeout(() => taRef.current?.focus(), 300); }, [isOpen]);

  const handleSend = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    sendMessage(t);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
            {isLoading && <div className="w-3 h-3 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearMessages} className="text-[11px] text-muted hover:text-[#0f172a] px-2 py-1 rounded-lg hover:bg-gray-100">초기화</button>
            )}
            <button onClick={closePanel} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-[#0f172a] hover:bg-gray-100 text-base">×</button>
          </div>
        </div>
        {topic && (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#f0f4f8', color: '#64748b' }}>
              현재 토픽: <span className="font-semibold text-[#0f172a]">{topic.label}</span>
            </span>
          </div>
        )}
      </div>

      <QuickActions onAction={sendQuickAction} hasQuizContext={false} disabled={isLoading} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {isEmpty && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#eef2ff' }}>👋</div>
            <div>
              <p className="font-semibold text-sm text-[#0f172a] mb-1">안녕하세요!</p>
              <p className="text-xs text-muted leading-relaxed">토픽에 대해 무엇이든 물어보세요.<br />문제 해설, 개념 설명, 예시 요청 모두 가능합니다.</p>
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
            <div ref={endRef} />
          </div>
        )}
      </div>

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
            placeholder="질문을 입력하세요..."
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
