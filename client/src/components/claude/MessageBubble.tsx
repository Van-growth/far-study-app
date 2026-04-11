import { Message } from '../../store/claudeStore';

interface MessageBubbleProps {
  message: Message;
}

// ── inline parser: **bold**, *italic*, `code` ──────────────────
function parseInline(text: string): React.ReactNode[] {
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const m = match[0];
    if (m.startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold">{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('`')) {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-[#065f46]">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith('*')) {
      parts.push(<em key={key++}>{m.slice(1, -1)}</em>);
    }
    lastIdx = match.index + m.length;
  }

  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

// ── block parser ───────────────────────────────────────────────
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  type ListBuf = { type: 'ol' | 'ul'; items: string[] };
  let listBuf: ListBuf | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuf) return;
    const { type, items } = listBuf;
    const cls = 'flex flex-col gap-0.5 my-1';
    result.push(
      type === 'ol' ? (
        <ol key={key++} className={`list-decimal ml-5 ${cls}`}>
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">{parseInline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key++} className={`list-disc ml-5 ${cls}`}>
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">{parseInline(item)}</li>
          ))}
        </ul>
      )
    );
    listBuf = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // blank line
    if (!line.trim()) {
      flushList();
      result.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // numbered list  (1. / 2. etc.)
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (listBuf?.type !== 'ol') { flushList(); listBuf = { type: 'ol', items: [] }; }
      listBuf.items.push(numMatch[2]);
      continue;
    }

    // bullet list  (- / • / *)
    const bulletMatch = line.match(/^[-•*]\s+(.*)/);
    if (bulletMatch) {
      if (listBuf?.type !== 'ul') { flushList(); listBuf = { type: 'ul', items: [] }; }
      listBuf.items.push(bulletMatch[1]);
      continue;
    }

    flushList();

    // heading  (## / #)
    const headMatch = line.match(/^#{1,3}\s+(.*)/);
    if (headMatch) {
      result.push(
        <p key={key++} className="text-sm font-bold text-[#0f172a] mt-2 mb-0.5">
          {parseInline(headMatch[1])}
        </p>
      );
      continue;
    }

    // regular paragraph
    result.push(
      <p key={key++} className="text-sm leading-relaxed">{parseInline(line)}</p>
    );
  }

  flushList();
  return result;
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
          className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed"
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
        className="max-w-[90%] px-4 py-3 rounded-2xl rounded-tl-sm flex flex-col gap-0.5"
        style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
      >
        {parseMarkdown(message.content)}
      </div>
    </div>
  );
}
