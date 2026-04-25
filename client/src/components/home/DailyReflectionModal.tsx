import { saveDailyReflection } from '../../lib/db';

const OPTIONS = [
  { emoji: '📚', label: '공부 우선순위 조절 실패',       category: 'priority_fail' },
  { emoji: '💼', label: '회사 업무 과다 / 야근',         category: 'overwork' },
  { emoji: '🍺', label: '친구·술자리',                   category: 'social' },
  { emoji: '😴', label: '그냥 하기 싫었음 (귀차니즘)',   category: 'lazy' },
  { emoji: '🌙', label: '너무 늦은 시간까지 데이트',     category: 'late_date' },
  { emoji: '👶', label: '육아 / 가족',                   category: 'family' },
  { emoji: '💻', label: '개발·사이드 프로젝트에 빠짐',   category: 'side_project' },
  { emoji: '✅', label: '없음 (잘 공부했어요)',           category: 'none' },
] as const;

interface Props {
  userId: string;
  onClose: () => void;
}

export default function DailyReflectionModal({ userId, onClose }: Props) {
  const handleSelect = async (opt: typeof OPTIONS[number]) => {
    onClose();
    await saveDailyReflection(userId, opt.category, `${opt.emoji} ${opt.label}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Daily Reflection</p>
          <h2 className="text-[15px] font-bold text-[#0f172a] leading-snug">
            어제 FAR 공부를 방해한 것이 있었나요?
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.category}
              onClick={() => handleSelect(opt)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; }}
            >
              <span className="text-base shrink-0">{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors text-center"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
