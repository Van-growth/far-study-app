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

// ── Main component ─────────────────────────────────────────────
export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = useClaudeStore((s) => s.isLoading);
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const reviewCardContext = useClaudeStore((s) => s.reviewCardContext);

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

  // Determine if this message is still being streamed
  const messages = useClaudeStore.getState().messages;
  const isLastMessage = messages[messages.length - 1]?.id === message.id;
  const isStreaming = isLastMessage && isLoading;

  return (
    <div className="flex gap-2 mb-3">
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
          <FeedbackButtons
            messageId={message.id}
            messagePreview={message.content}
            source="claude"
            topicId={reviewCardContext?.topicId ?? currentTopicId ?? null}
            extractionId={reviewCardContext?.extractionId ?? null}
          />
        )}
      </div>
    </div>
  );
}
