import Markdown from 'react-markdown';
import { Message } from '../../store/claudeStore';

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

// ── Main component ─────────────────────────────────────────────
export default function MessageBubble({ message }: MessageBubbleProps) {
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
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
        C
      </div>

      {/* Bubble */}
      <div
        className="max-w-[90%] px-4 py-3 rounded-2xl rounded-tl-sm claude-md"
        style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
      >
        <Markdown
          components={{
            h1: ({ children }) => <p className="text-base font-bold text-[#0f172a] mt-3 mb-1">{children}</p>,
            h2: ({ children }) => <p className="text-sm font-bold text-[#0f172a] mt-3 mb-1">{children}</p>,
            h3: ({ children }) => <p className="text-sm font-bold text-[#0f172a] mt-2 mb-0.5">{children}</p>,
            p: ({ children }) => <p className="text-sm leading-relaxed text-[#0f172a] mb-1.5">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-[#0f172a]">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc ml-5 my-1 flex flex-col gap-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-5 my-1 flex flex-col gap-0.5">{children}</ol>,
            li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-');
              if (isBlock) {
                return (
                  <pre className="my-2 p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
                    style={{ background: '#f1f5f9', color: '#0f172a' }}>
                    <code>{children}</code>
                  </pre>
                );
              }
              return (
                <code className="px-1 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-[#065f46]">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-3 border-[#4f6ef7] pl-3 my-2 text-sm text-muted italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3 border-border" />,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="text-[#4f6ef7] underline underline-offset-2 text-sm">
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="text-xs border border-border w-full">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead style={{ background: '#f8fafc' }}>{children}</thead>,
            th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
          }}
        >
          {message.content}
        </Markdown>
      </div>
    </div>
  );
}
