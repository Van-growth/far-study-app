import ScienceCard from '../components/science/ScienceCard';
import RoutineTimeline from '../components/science/RoutineTimeline';
import LearningScienceHero from '../components/science/LearningScienceHero';

const SECTIONS = [
  { id: 'active-recall', label: 'Active Recall' },
  { id: 'spaced-repetition', label: 'Spaced Repetition' },
  { id: 'feynman', label: 'Feynman Technique' },
  { id: 'interleaving', label: 'Interleaving' },
  { id: 'routine', label: '하루 루틴' },
  { id: 'avoid', label: '피해야 할 공부법' },
];

const BAD_GOOD = [
  { bad: '노트 다시 읽기', good: 'Active Recall로 꺼내기' },
  { bad: '형광펜 치기', good: '직접 써보기' },
  { bad: '같은 토픽 몰아서 풀기', good: 'Interleaving 섞어서 풀기' },
  { bad: '시험 전날 벼락치기', good: 'Spaced Repetition 간격 복습' },
  { bad: '"알 것 같다"에서 멈추기', good: 'Feynman으로 설명해보기' },
  { bad: '정답 보고 "맞네" 확인', good: '보기 전에 먼저 작성' },
];

const REFS = [
  'Karpicke & Roediger (2008). The Critical Importance of Retrieval for Learning. Science.',
  'Cepeda et al. (2006). Distributed Practice in Verbal Recall Tasks. Psychological Bulletin.',
  'Rohrer & Taylor (2007). The Shuffling of Mathematics Problems Improves Learning. Instructional Science.',
  'Nestojko et al. (2014). Expecting to Teach Enhances Learning and Organization. Memory & Cognition.',
  'Chi et al. (1989). Self-Explanations: How Students Study and Use Examples in Learning. Cognitive Science.',
  'Ebbinghaus (1885). Über das Gedächtnis. (망각 곡선 원본 연구)',
];

export default function SciencePage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-full" style={{ background: '#f0f4f8' }}>
      {/* Sticky anchor nav */}
      <nav
        className="sticky top-0 z-40 bg-white border-b border-border"
        style={{ top: 0 }}
      >
        <div className="max-w-[900px] mx-auto px-6 flex items-center gap-1 overflow-x-auto py-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-[#0f172a] hover:bg-gray-100 transition-colors shrink-0"
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-[900px] mx-auto px-6 py-10 flex flex-col gap-12">
        {/* Hero */}
        <LearningScienceHero />

        {/* Section 1: Active Recall */}
        <section id="active-recall">
          <ScienceCard
            accent="#4f6ef7"
            icon="🔁"
            title="Active Recall (능동적 인출)"
            stats={[
              { value: '50–100%', label: 'Active recall 사용 시\n단순 복습 대비 추가 기억량' },
              { value: '28% vs 68%', label: '1주 후 retention:\n읽기 반복 vs 시험 보기' },
              { value: '4.6배', label: '시험 직전 학습 대비\n인출 연습의 장기 기억 효과' },
            ]}
            principle={`정보를 꺼낼 때(retrieval) 뉴런 간 시냅스 연결이 강화된다.

읽기는 인식(recognition)만 활성화하지만,
인출(recall)은 해마와 전전두엽을 동시에 자극해
장기기억 경로를 실제로 강화한다.

"재생(retrieval)"의 횟수가 많을수록
다음 재생이 더 빠르고 정확해진다.`}
            illusion={`"읽었으니까 안다" → 이건 familiarity(친숙함)이지 memory(기억)가 아니다.

시험장에서 blank가 생기는 이유가 여기 있다.
교재를 50번 읽어도 실제 인출 연습 없이는 시험에서 꺼낼 수 없다.`}
            appNote="플래시카드 3단계 — 먼저 직접 작성하고, 그 다음 확인. 답을 보기 전에 작성을 강제함으로써 매번 인출 연습이 일어난다."
            citation="출처: Karpicke & Roediger (2008). Science. / Roediger & Karpicke (2006). Psychological Science."
          />
        </section>

        {/* Section 2: Spaced Repetition */}
        <section id="spaced-repetition">
          <ScienceCard
            accent="#10b981"
            icon="📅"
            title="Spaced Repetition (간격 반복)"
            stats={[
              { value: '79%', label: '학습 1개월 후 복습 없으면\n망각되는 비율 (Ebbinghaus)' },
              { value: '2–4배', label: '동일 시간으로 간격 반복 적용 시\n장기 보유량' },
              { value: '23%', label: 'SRS 사용 의대생 그룹의\n일반 그룹 대비 성적 향상' },
            ]}
            principle={`기억은 사용할수록 강해지고 안 쓰면 약해진다.

핵심은 "망각 직전에 복습"하는 것.
너무 일찍 복습하면 뇌가 쉽게 답을 찾아 강화 효과가 없다.
적당히 어려운 시점(desirable difficulty)에 꺼내야
시냅스가 강화된다.`}
            appNote={`복습 간격 시각화: 1일 → 3일 → 7일 → 14일 → 30일 → 60일

맞은 문제 → 다음 복습이 자동으로 늘어남.
틀린 문제 → 내일 다시 출제.
대시보드 DUE 표시가 최적 복습 시점을 안내한다.`}
            citation="출처: Cepeda et al. (2006). Psychological Bulletin. / Ebbinghaus (1885). Über das Gedächtnis."
          />

          {/* SRS Timeline visual */}
          <div className="card p-6 mt-4">
            <p className="text-sm font-semibold text-[#0f172a] mb-4">복습 간격 타임라인</p>
            <div className="flex items-center gap-0">
              {[1, 3, 7, 14, 30, 60].map((days, i) => (
                <div key={days} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `hsl(${160 + i * 15}, 70%, ${45 + i * 3}%)` }}
                    >
                      {days}d
                    </div>
                    <p className="text-[10px] text-muted mt-1">{days}일 후</p>
                  </div>
                  {i < 5 && (
                    <div
                      className="h-0.5 flex-1 mx-1"
                      style={{ background: `hsl(${160 + i * 15}, 40%, 80%)` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Feynman */}
        <section id="feynman">
          <ScienceCard
            accent="#f59e0b"
            icon="🧠"
            title="Feynman Technique (가르치기)"
            stats={[
              { value: '2.6배', label: '자기설명 학생이\n그냥 읽은 학생보다 높은 문제 해결력' },
              { value: 'Protégé Effect', label: '가르쳐야 한다는 기대만으로\n학습 효율 상승' },
              { value: '40%', label: '설명 그룹의 1주 후\n기억 보유율 향상 (대조군 대비)' },
            ]}
            principle={`설명하려면 개념을 재구조화(reorganization)해야 한다.

이 과정에서 뇌는 지식의 빈틈을 스스로 발견한다.
"안다고 생각했는데 설명 못하는" 상태
= illusion of competence(능력 착각).

Feynman Technique의 핵심:
막히는 지점 = 실제로 모르는 지점이다.`}
            illusion={`"노트를 보면서 설명하는 건 reading이지 recall이 아니다."

교재를 보며 이해한 것은 이해한 것이지 기억한 것이 아니다.
시험장은 빈 종이다.`}
            appNote="각 토픽마다 맞춤 질문 제공. 작성 후 Claude가 놓친 개념을 정확히 짚어준다. '막히는 지점 = 모르는 지점'을 즉시 파악할 수 있다."
            citation="출처: Nestojko et al. (2014). Memory & Cognition. / Chi et al. (1989). Cognitive Science."
          />
        </section>

        {/* Section 4: Interleaving */}
        <section id="interleaving">
          <ScienceCard
            accent="#8b5cf6"
            icon="🔀"
            title="Interleaving (섞어서 풀기)"
            stats={[
              { value: '43%', label: 'Interleaving 그룹이\nblocking 그룹보다 높은 시험 성적' },
              { value: '25%', label: '1개월 후\n기억 보유량 차이' },
              { value: '≠ CPA 시험', label: '실제 시험은 한 토픽만\n연속으로 나오지 않는다' },
            ]}
            principle={`같은 토픽만 연속으로 풀면(blocking) 뇌가
단기 작업기억에서 같은 풀이를 재사용한다.

섞어서 풀면 매번 장기기억에서 꺼내야 하므로
더 강한 기억 경로가 형성된다.

CPA 시험은 한 토픽만 연속으로 나오지 않는다.
섞인 문제를 풀어야 실제 시험과 동일한
인지 환경이 만들어진다.`}
            appNote="전체 퀴즈는 항상 토픽 셔플. 같은 토픽 2문제 연속 출제 방지 알고리즘 적용. Header의 '전체퀴즈' 버튼이 Interleaving 모드다."
            citation="출처: Rohrer & Taylor (2007). Instructional Science. / Taylor & Rohrer (2010). Applied Cognitive Psychology."
          />
        </section>

        {/* Section 5: Routine */}
        <section id="routine">
          <div className="card p-8 mb-4" style={{ borderTop: '4px solid #0ea5e9' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📆</span>
              <h2 className="text-2xl font-bold text-[#0f172a]">FAR 합격을 위한 하루 루틴</h2>
            </div>
            <p className="text-sm text-muted mb-6">
              4가지 학습법을 일별로 어떻게 적용할지 구체적으로 설계된 루틴입니다.
            </p>
            <RoutineTimeline />
          </div>
        </section>

        {/* Section 6: Avoid */}
        <section id="avoid">
          <div className="card overflow-hidden" style={{ borderTop: '4px solid #ef4444' }}>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🚫</span>
                <h2 className="text-2xl font-bold text-[#0f172a]">이렇게 하면 시간 낭비다</h2>
              </div>
              <p className="text-sm text-muted mb-6">
                "대부분의 학생이 최소 효과적인 방법으로 공부한다" — Karpicke (2011) Science
              </p>

              <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th className="text-left text-xs font-semibold text-muted px-4 py-3 w-1/2">
                        ❌ 이렇게 하지 마세요
                      </th>
                      <th className="text-left text-xs font-semibold text-muted px-4 py-3 w-1/2">
                        ✅ 대신 이렇게
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {BAD_GOOD.map((item, i) => (
                      <tr
                        key={i}
                        style={{ borderTop: '1px solid #f1f5f9' }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className="text-sm px-2 py-1 rounded"
                            style={{ background: '#fff5f5', color: '#dc2626' }}
                          >
                            {item.bad}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-sm px-2 py-1 rounded"
                            style={{ background: '#f0fdf4', color: '#16a34a' }}
                          >
                            {item.good}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted mt-4">
                출처: Karpicke (2011). Retrieval Practice Produces More Learning than Elaborative Studying. Science.
              </p>
            </div>
          </div>
        </section>

        {/* References */}
        <footer className="border-t border-border pt-8">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            이 앱은 아래 연구에 기반합니다
          </h3>
          <ul className="flex flex-col gap-2">
            {REFS.map((ref, i) => (
              <li key={i} className="text-xs text-muted leading-relaxed flex gap-2">
                <span className="text-[#4f6ef7] font-mono shrink-0">[{i + 1}]</span>
                {ref}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-6 pt-4 border-t border-border">
            FAR Study App · Built with Active Recall, Spaced Repetition, Feynman Technique, and Interleaving
          </p>
        </footer>
      </div>
    </div>
  );
}
