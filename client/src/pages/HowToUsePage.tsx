// ── How to Use Page ───────────────────────────────────────────

const STEPS = [
  {
    num: '①',
    title: '사용자 행동',
    color: '#4f6ef7',
    bg: '#eef2ff',
    border: '#c7d2fe',
    icon: '🧑‍💻',
    items: [
      { label: '개념 분석', desc: 'FAR 문제를 붙여넣어 한국어 해설 + 트리거 추출' },
      { label: '복습 카드', desc: '이전에 분석한 문제를 SRS 스케줄로 재복습' },
      { label: '튜터 채팅', desc: '/go 개념 설명 · /re 복습 요약 · /qu 예시 문제' },
      { label: 'Daily Reflection', desc: '오늘 컨디션·방해 요인·집중 모듈 기록' },
    ],
  },
  {
    num: '②',
    title: 'Supabase DB 저장',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    icon: '🗄️',
    items: [
      { label: 'concept_extractions', desc: '개념·트리거·함정·예시 문제 누적' },
      { label: 'topic_progress', desc: '토픽별 시도 횟수·정답 횟수 업데이트' },
      { label: 'daily_review_log', desc: '복습 완료 기록 (날짜·토픽·결과)' },
      { label: 'daily_reflection', desc: '컨디션·방해 요인·집중 모듈 저장' },
    ],
  },
  {
    num: '③',
    title: '연산 및 집계',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: '⚙️',
    items: [
      { label: '정답률', desc: 'correct ÷ attempts — 토픽별 약점 판별' },
      { label: '복습 완료 추이', desc: '날짜별 완료 건수 시계열 집계' },
      { label: '회고 분석 TOP3', desc: '기간 내 정답률 상위·하위 토픽 추출' },
      { label: 'D-Day 계산', desc: '시험일까지 남은 날 실시간 산정' },
    ],
  },
  {
    num: '④',
    title: '대시보드 출력',
    color: '#0f172a',
    bg: '#f8fafc',
    border: '#e2e8f0',
    icon: '📊',
    items: [
      { label: 'D-Day 배너', desc: '시험일까지 남은 날 강조 표시' },
      { label: '복습 완료 추이', desc: '최근 학습 흐름 시각화' },
      { label: '회고 분석', desc: '1일·1주·1달 기준 효과적/비효율 토픽' },
      { label: 'FAR 섹션별 진도', desc: 'F1–F6 섹션 정답률 한눈에 확인' },
    ],
  },
  {
    num: '⑤',
    title: '학습 효과',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '🎯',
    items: [
      { label: '약점 조기 발견', desc: '정답률 낮은 토픽을 데이터로 특정' },
      { label: '간격 반복 최적화', desc: 'SRS 스케줄로 망각 직전 재노출' },
      { label: '메타인지 강화', desc: '내 오류 패턴 인지 → 시험장 실수 방지' },
    ],
  },
];

function Arrow() {
  return (
    <div className="flex flex-col items-center gap-0 py-1">
      <div className="w-0.5 h-4 bg-[#cbd5e1]" />
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M6 8L0 0h12L6 8z" fill="#94a3b8" />
      </svg>
    </div>
  );
}

function StepCard({
  step,
}: {
  step: typeof STEPS[number];
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
      style={{ background: step.bg, border: `1.5px solid ${step.border}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-bold"
          style={{ background: step.color, color: 'white' }}
        >
          {step.num}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{step.icon}</span>
            <p className="text-sm font-bold" style={{ color: step.color }}>
              {step.title}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {step.items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl px-3 py-2.5 bg-white/80"
            style={{ border: `1px solid ${step.border}` }}
          >
            <p className="text-xs font-semibold" style={{ color: step.color }}>
              {it.label}
            </p>
            <p className="text-[11px] text-[#475569] mt-0.5 leading-snug">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowToUsePage() {
  return (
    <div className="p-4 sm:p-6 pb-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-1">

        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-[#0f172a]">How to Use</h1>
          <p className="text-xs text-[#475569] mt-1">
            FAR Study App이 데이터를 쌓아 합격으로 연결하는 5단계 흐름
          </p>
        </div>

        {/* 5-step flow */}
        {STEPS.map((step, i) => (
          <div key={step.num}>
            <StepCard step={step} />
            {i < STEPS.length - 1 && <Arrow />}
          </div>
        ))}

        {/* Goal */}
        <Arrow />
        <div
          className="rounded-2xl px-5 py-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          }}
        >
          <span className="text-3xl shrink-0">🏆</span>
          <div>
            <p className="text-base font-bold text-white">FAR 합격</p>
            <p className="text-xs text-white/70 mt-0.5">목표 시험일: 2026-06-08</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-5 rounded-xl px-4 py-3"
          style={{ background: '#fefce8', border: '1px solid #fde68a' }}
        >
          <p className="text-xs text-[#92400e] leading-relaxed">
            💡 <strong>회고 분석</strong>은 실제 복습 카드 풀이 데이터가 2~3주 쌓여야 의미 있어요.
            지금 바로 분석 탭에서 문제를 추가하고 복습을 시작하면 2주 후부터 유의미한 패턴이 보입니다.
          </p>
        </div>

      </div>
    </div>
  );
}
