interface StatItem {
  value: string;
  label: string;
}

interface ScienceCardProps {
  accent: string;
  icon: string;
  title: string;
  stats: StatItem[];
  principle: string;
  illusion?: string;
  appNote: string;
  citation: string;
}

export default function ScienceCard({
  accent,
  icon,
  title,
  stats,
  principle,
  illusion,
  appNote,
  citation,
}: ScienceCardProps) {
  return (
    <section
      className="card overflow-hidden"
      style={{ borderTop: `4px solid ${accent}` }}
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{icon}</span>
          <h2 className="text-2xl font-bold text-[#0f172a]">{title}</h2>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 text-center"
              style={{ background: accent + '0d', border: `1px solid ${accent}25` }}
            >
              <p
                className="text-3xl font-black mb-1"
                style={{ color: accent, letterSpacing: '-1px' }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Principle */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            🧬 뇌과학 원리
          </p>
          <p className="text-sm text-[#0f172a] leading-relaxed whitespace-pre-line">{principle}</p>
        </div>

        {/* Illusion Box */}
        {illusion && (
          <div
            className="p-4 rounded-xl mb-6"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <p className="text-xs font-semibold text-[#92400e] mb-1">⚠️ 흔한 착각</p>
            <p className="text-sm text-[#0f172a] leading-relaxed">{illusion}</p>
          </div>
        )}

        {/* App Note */}
        <div
          className="p-4 rounded-xl mb-5"
          style={{ background: accent + '0a', border: `1px solid ${accent}20` }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: accent }}>
            📱 이 앱의 적용
          </p>
          <p className="text-sm text-[#0f172a] leading-relaxed">{appNote}</p>
        </div>

        {/* Citation */}
        <p className="text-[11px] text-muted">{citation}</p>
      </div>
    </section>
  );
}
