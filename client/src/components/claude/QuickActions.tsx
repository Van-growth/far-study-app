interface QuickActionsProps {
  onAction: (action: string) => void;
  hasQuizContext: boolean;
  disabled: boolean;
}

const ACTIONS = [
  { key: 'summary', label: '핵심 요약', emoji: '📋' },
  { key: 'trap', label: '자주 나오는 함정', emoji: '⚠️' },
  { key: 'example', label: '쉬운 예시로 설명', emoji: '💡' },
];

export default function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border">
      {ACTIONS.map((a) => (
        <button
          key={a.key}
          onClick={() => onAction(a.key)}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40"
          style={{
            background: '#f8faff',
            border: '1px solid #c7d2fe',
            color: '#4f6ef7',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#f8faff';
          }}
        >
          <span>{a.emoji}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}
