interface TimelineStep {
  step: number;
  text: string;
}

interface TimelineDay {
  day: string;
  accent: string;
  steps: TimelineStep[];
}

const TIMELINE: TimelineDay[] = [
  {
    day: 'Day 1 | 새 토픽 처음 접할 때',
    accent: '#4f6ef7',
    steps: [
      { step: 1, text: '개념 카드 1회 정독 (Rules, 공식, 함정 모두 확인)' },
      { step: 2, text: '덮고 핵심 Rule 말로 꺼내보기 (Active Recall — 책 닫기!)' },
      { step: 3, text: '플래시카드 3단계 (쓴 다음 확인, 자기평가)' },
      { step: 4, text: '퀴즈 해당 토픽 (2-3문제 풀기)' },
    ],
  },
  {
    day: 'Day 2 | 다음 날',
    accent: '#10b981',
    steps: [
      { step: 1, text: 'DUE 뱃지 확인 → 복습 퀴즈 (어제 틀린 토픽 우선)' },
      { step: 2, text: 'Feynman: "이 개념을 Claude에게 설명하기" → 피드백 확인' },
      { step: 3, text: '새 토픽 추가 (Day 1 루틴 반복)' },
    ],
  },
  {
    day: 'Day 4~7 | 간격 복습',
    accent: '#f59e0b',
    steps: [
      { step: 1, text: 'DUE 토픽만 선택 복습 (헤더의 빨간 DUE 버튼)' },
      { step: 2, text: '전체 퀴즈 (Interleaving 모드) — 20문제 셔플' },
      { step: 3, text: '오답 토픽 → 개념 카드 재확인 후 Feynman 설명' },
    ],
  },
  {
    day: '시험 2주 전',
    accent: '#ef4444',
    steps: [
      { step: 1, text: '약점 토픽 집중 (현황 탭 → 약점 분석 확인)' },
      { step: 2, text: '매일 Interleaving 전체 퀴즈 (모든 토픽 셔플)' },
      { step: 3, text: '오답 Feynman — "왜 틀렸는지" Claude에게 설명' },
      { step: 4, text: 'Trigger→Rule 카드 빠르게 소환 연습' },
    ],
  },
];

export default function RoutineTimeline() {
  return (
    <div className="flex flex-col gap-5">
      {TIMELINE.map((day) => (
        <div
          key={day.day}
          className="card overflow-hidden"
          style={{ borderLeft: `4px solid ${day.accent}` }}
        >
          <div className="p-5">
            <p className="font-bold text-[#0f172a] mb-4" style={{ color: day.accent }}>
              {day.day}
            </p>
            <div className="flex flex-col gap-3">
              {day.steps.map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: day.accent }}
                  >
                    {s.step}
                  </span>
                  <p className="text-sm text-[#0f172a] leading-relaxed pt-0.5">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
