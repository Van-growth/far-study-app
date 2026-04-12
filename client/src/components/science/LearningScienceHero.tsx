// Ivy-league-branded hero for the Learning Science page.
// Layout: badge → title → subtext → 4-stat grid → Before/After 2-col.
// The whole thing is wrapped in a single bordered card and split by
// border-top lines between rows.

const STATS = [
  {
    value: '4.6×',
    label: '벼락치기 대비 장기 기억 효과',
    color: '#4f6ef7',
    bg: '#eef2ff',
  },
  {
    value: '79%',
    label: '복습 없으면 1달 후 망각',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    value: '2.6×',
    label: '설명하면 문제 해결력',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    value: '43%',
    label: '섞어 풀면 시험 성적 차이',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

const BAD_LIST = [
  '교재 반복해서 읽기',
  '같은 토픽 몰아서 풀기',
  '시험 전날 벼락치기',
  '"알 것 같다"에서 멈추기',
];

const GOOD_LIST = [
  '인출 연습으로 꺼내기',
  'Interleaving 섞어 풀기',
  '간격 반복으로 분산 복습',
  'Feynman으로 설명해보기',
];

export default function LearningScienceHero() {
  return (
    <div
      className="overflow-hidden bg-white"
      style={{ border: '0.5px solid #e2e8f0', borderRadius: 12 }}
    >
      {/* Top: badge + title + subtext */}
      <div className="px-6 py-7 sm:px-8 sm:py-9 flex flex-col items-start gap-3">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: '#eef2ff', color: '#4338ca', letterSpacing: '0.08em' }}
        >
          HARVARD · MIT · PRINCETON 검증 학습법
        </span>
        <h2
          className="text-[#0f172a]"
          style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.35 }}
        >
          같은 시간, 2~4배 더 오래 기억된다
        </h2>
        <p
          className="text-muted leading-relaxed"
          style={{ fontSize: 13, maxWidth: 640 }}
        >
          대부분의 수험생은 가장 비효율적인 방법으로 공부한다. 이 앱은 인지과학이
          증명한 4가지 기법으로 FAR 합격까지의 시간을 줄인다.
        </p>
      </div>

      {/* Stat grid — divided by border-top */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4"
        style={{ borderTop: '0.5px solid #e2e8f0' }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="px-5 py-5 flex flex-col gap-1"
            style={{
              borderLeft: i > 0 ? '0.5px solid #f1f5f9' : undefined,
              // mobile: second row gets a top border for the 2x2 wrap
              ...(i >= 2 ? { borderTop: '0.5px solid #f1f5f9' } : {}),
            }}
          >
            <div
              className="inline-flex items-center justify-center self-start px-2 py-0.5 rounded"
              style={{ background: s.bg }}
            >
              <span
                className="font-bold tabular-nums"
                style={{ fontSize: 22, color: s.color, letterSpacing: '-0.02em' }}
              >
                {s.value}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Before / After — divided by border-top, each column tinted */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ borderTop: '0.5px solid #e2e8f0' }}
      >
        <div
          className="px-6 py-5"
          style={{ background: '#fef2f2' }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: '#991b1b', letterSpacing: '0.06em' }}
          >
            ❌ 대부분의 수험생
          </p>
          <ul className="flex flex-col gap-1.5">
            {BAD_LIST.map((b) => (
              <li
                key={b}
                className="text-xs leading-snug flex gap-1.5"
                style={{ color: '#7f1d1d' }}
              >
                <span className="opacity-60">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="px-6 py-5"
          style={{
            background: '#f0fdf4',
            borderLeft: '0.5px solid #e2e8f0',
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: '#166534', letterSpacing: '0.06em' }}
          >
            ✅ 이 앱의 방식
          </p>
          <ul className="flex flex-col gap-1.5">
            {GOOD_LIST.map((g) => (
              <li
                key={g}
                className="text-xs leading-snug flex gap-1.5"
                style={{ color: '#14532d' }}
              >
                <span className="opacity-60">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
