import { useState, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Message } from '../../store/claudeStore';
import useClaudeStore from '../../store/claudeStore';
import useStudyStore from '../../store/studyStore';
import FeedbackButtons from '../feedback/FeedbackButtons';

interface MessageBubbleProps {
  message: Message;
}

// Strip HTML/SVG tags and ```html/svg fences for TTS plaintext
function extractTextForTts(content: string): string {
  const noBlocks = content.replace(/```(?:html|svg)[\s\S]*?```/gi, '[그림]');
  return noBlocks.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Typing animation (3 dots) ──────────────────────────────────
export function TypingBubble() {
  return (
    <div className="flex gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5">
        C
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] inline-block"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Markdown components map ────────────────────────────────────
const MD_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => <p className="text-base font-bold text-[#0f172a] mt-3 mb-1">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="text-sm font-bold text-[#0f172a] mt-3 mb-1">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="text-sm font-bold text-[#0f172a] mt-2 mb-0.5">{children}</p>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-sm leading-relaxed text-[#0f172a] mb-1.5">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-[#1e1b4b]">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc ml-5 my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal ml-5 my-1 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm leading-relaxed">{children}</li>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const lang = className?.replace('language-', '') ?? '';
    const raw = String(children ?? '').replace(/\n$/, '');
    if (lang === 'html' || lang === 'svg') {
      return <div className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: raw }} />;
    }
    if (className?.includes('language-')) {
      return (
        <pre className="my-2 p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto" style={{ background: '#f1f5f9', color: '#0f172a' }}>
          <code>{children}</code>
        </pre>
      );
    }
    return <code className="px-1 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-[#065f46]">{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-[#4f6ef7] pl-3 my-2 text-sm text-[#64748b] italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-[#e2e8f0]" />,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4f6ef7] underline underline-offset-2 text-sm">{children}</a>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2"><table className="text-xs border border-[#e2e8f0] w-full">{children}</table></div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead style={{ background: '#f8fafc' }}>{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-[#e2e8f0] px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-[#e2e8f0] px-2 py-1">{children}</td>,
};

// ── TTS hook ───────────────────────────────────────────────────
function useTts(content: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggle = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = extractTextForTts(content);
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utterRef.current = utter;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.startsWith('ko'));
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      utter.voice = koVoice ?? enVoice ?? null;
      utter.lang = koVoice ? 'ko-KR' : 'en-US';
      window.speechSynthesis.speak(utter);
      setIsSpeaking(true);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    } else {
      speak();
    }
  }, [isSpeaking, content]);

  return { isSpeaking, toggle };
}

// ── Main component ─────────────────────────────────────────────
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = useClaudeStore((s) => s.isLoading);
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const reviewCardContext = useClaudeStore((s) => s.reviewCardContext);
  const [copied, setCopied] = useState(false);
  const { isSpeaking, toggle: toggleTts } = useTts(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-3 gap-0.5">
        {message.corrected && (
          <span className="text-[10px] text-[#94a3b8] pr-1">✏️ 교정됨</span>
        )}
        <div
          className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: '#4f6ef7' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const messages = useClaudeStore.getState().messages;
  const isLastMessage = messages[messages.length - 1]?.id === message.id;
  const isStreaming = isLastMessage && isLoading;

  return (
    <div className="group flex gap-2 mb-3">
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
        C
      </div>

      {/* Bubble */}
      <div
        className="max-w-[90%] px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
      >
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MD_COMPONENTS as never}>
          {message.content}
        </Markdown>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-[#4f6ef7] ml-0.5 animate-pulse align-text-bottom rounded-sm" />
        )}
        {!isStreaming && message.content && (
          <div className="flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <FeedbackButtons
              messageId={message.id}
              messagePreview={message.content}
              source="claude"
              topicId={reviewCardContext?.topicId ?? currentTopicId ?? null}
              extractionId={reviewCardContext?.extractionId ?? null}
            />
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="ml-0.5 w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100"
              title="답변 복사"
            >
              {copied ? (
                <span className="text-[10px] text-[#166534] font-semibold">✓</span>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
            {/* TTS button */}
            <button
              onClick={toggleTts}
              className="ml-0.5 w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100"
              title={isSpeaking ? '정지' : '읽어주기'}
            >
              {isSpeaking ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#4f6ef7" stroke="none">
                  <rect x="4" y="4" width="5" height="16" rx="1" />
                  <rect x="15" y="4" width="5" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
