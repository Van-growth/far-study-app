import { useNavigate } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────
const BLUE = '#3C8EFF';
const BLUE_LIGHT = '#EBF3FF';
const BLUE_MID = '#C7DEFF';
const BLUE_DARK = '#1A5FCC';

// ── 1. Hero ───────────────────────────────────────────────────
const BADGES = [
  { icon: '📚', value: '6×', label: '문제당 학습 깊이', sub: '교재 단독 대비' },
  { icon: '🎯', value: '50%', label: 'TBS 배점', sub: 'FAR 시험 전체 기준' },
  { icon: '🧠', value: '포함', label: '메타인지 훈련', sub: '자가진단 + AI 교정' },
];

function HeroSection() {
  return (
    <section
      className="rounded-2xl px-6 py-10 sm:px-10 sm:py-14 text-center flex flex-col items-center gap-6"
      style={{ background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE} 100%)` }}
    >
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3">
          FAR Study App · 학습 효과
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
          MCQ 1문제를<br />TBS 수준으로 소화한다
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
          단순 암기가 아닌 개념 내재화 —<br className="hidden sm:block" />
          FAR 시험 TBS 50% 배점을 함께 준비합니다
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
        {BADGES.map((b) => (
          <div
            key={b.label}
            className="rounded-xl px-3 py-4 flex flex-col items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <span className="text-2xl">{b.icon}</span>
            <span className="text-xl sm:text-2xl font-bold text-white">{b.value}</span>
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 text-center">{b.label}</span>
            <span className="text-[9px] text-white/60 text-center">{b.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 2. Comparison ─────────────────────────────────────────────
const BECKER_STEPS = [
  { n: 1, text: 'MCQ 풀기' },
  { n: 2, text: '정답 확인' },
  { n: 3, text: '영어 해설 읽기' },
  { n: 4, text: '다음 문제로 → 기억에만 의존' },
];

const APP_STEPS = [
  { n: 1, text: 'MCQ 풀기' },
  { n: 2, text: '한국어 구조화 해설 + 도식 + 함정 + 정답 접근법' },
  { n: 3, text: 'Harry 질문 (문제 컨텍스트 인식 상태)' },
  { n: 4, text: '자가진단 + AI 평가 → 오개념 즉시 교정' },
  { n: 5, text: '데이터 누적 → 비슷한 유형 자동 재출제' },
];

function StepItem({ n, text, accent }: { n: number; text: string; accent: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
        style={{ background: accent, color: 'white' }}
      >
        {n}
      </span>
      <p className="text-sm text-[#1e293b] leading-snug">{text}</p>
    </div>
  );
}

function ComparisonSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
          "교재만" vs "FAR Study App 병행"
        </h2>
        <p className="text-xs text-muted mt-1">같은 1문제, 완전히 다른 학습 밀도</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Becker only */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📘</span>
            <p className="text-sm font-bold text-[#475569]">교재만</p>
          </div>
          <div className="flex flex-col gap-3">
            {BECKER_STEPS.map((s) => <StepItem key={s.n} {...s} accent="#94a3b8" />)}
          </div>
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}
          >
            <span className="text-xs font-semibold text-[#64748b]">문제당 노출</span>
            <span className="text-2xl font-bold text-[#94a3b8] block mt-0.5">1×</span>
          </div>
        </div>

        {/* FAR Study App */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: BLUE_LIGHT, border: `1.5px solid ${BLUE_MID}` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🚀</span>
            <p className="text-sm font-bold" style={{ color: BLUE_DARK }}>FAR Study App 병행</p>
          </div>
          <div className="flex flex-col gap-3">
            {APP_STEPS.map((s) => <StepItem key={s.n} {...s} accent={BLUE} />)}
          </div>
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ background: BLUE, border: `1px solid ${BLUE_DARK}` }}
          >
            <span className="text-xs font-semibold text-white/80">문제당 노출</span>
            <span className="text-2xl font-bold text-white block mt-0.5">6×</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. TBS 연결 ───────────────────────────────────────────────
const TBS_CARDS = [
  { icon: '🔍', title: '개념 언어화', desc: 'TBS 답안 근거를 문장으로 서술하는 능력' },
  { icon: '🧩', title: '함정 패턴 인식', desc: '출제자 유인 면역 — 오답지가 보인다' },
  { icon: '⚡', title: '트리거 → 접근법', desc: 'TBS 지문 읽자마자 방향 즉시 결정' },
  { icon: '🔄', title: '메타인지 훈련', desc: '시험장 실수 방지 — 내 오류 패턴 인지' },
  { icon: '🧮', title: '계산 흐름 내재화', desc: 'TBS 단계별 분해 능력 자동화' },
  { icon: '📊', title: '약점 자가 파악', desc: 'TBS 취약 유형 집중 대비 전략화' },
];

function TBSSection() {
  return (
    <section
      className="rounded-2xl px-6 py-8 flex flex-col gap-6"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-1">Why TBS</p>
        <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
          MCQ를 제대로 소화하면 TBS가 보인다
        </h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          FAR Study App이 키우는 6가지 역량은 모두 TBS 답안 작성에 직결됩니다
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TBS_CARDS.map((c) => (
          <div
            key={c.title}
            className="rounded-xl p-4 flex gap-3 items-start bg-white"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <span className="text-xl shrink-0">{c.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{c.title}</p>
              <p className="text-xs text-muted mt-0.5 leading-snug">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 4. 예시 섹션 ──────────────────────────────────────────────
function ExampleSection() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-1">Real Example</p>
        <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">같은 개념, MCQ에서 TBS로</h2>
        <p className="text-xs text-muted mt-1">Revenue Recognition(ASC 606)을 예시로</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Card 1 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#f1f5f9' }}>
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wide">Step 1</span>
            <span className="text-xs text-muted">MCQ로 접하는 방식 (FAR F2-M1)</span>
          </div>
          <div className="px-4 py-4 bg-white">
            <p className="text-xs text-muted font-mono mb-2">Q. Company A sells a product with a right of return...</p>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-[#4f6ef7] mt-0.5 shrink-0">FAR Study App</span>
                <p className="text-xs text-[#0f172a]">
                  한국어 해설 · Variable consideration → 예상 환불 부채 인식 · 함정: 전액 매출 인식 유혹 ·
                  트리거: "right of return" → ASC 606-10-55-22
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${BLUE_MID}` }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: BLUE_LIGHT }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BLUE_DARK }}>Step 2</span>
            <span className="text-xs" style={{ color: BLUE_DARK }}>같은 개념이 TBS에서 변형되는 방식</span>
          </div>
          <div className="px-4 py-4 bg-white">
            <p className="text-xs text-muted mb-2">TBS는 숫자 계산 + 분개 + 공시 모두 요구합니다</p>
            <div className="flex flex-col gap-1.5">
              {[
                'Gross revenue vs Net revenue 분개 작성',
                '기말 환불 부채 잔액 계산 (historical return rate 적용)',
                '재무제표 표시 방법 서술 (ASC 근거 포함)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: BLUE }} />
                  <p className="text-xs text-[#0f172a]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #86efac' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#f0fdf4' }}>
            <span className="text-xs font-bold text-[#166534] uppercase tracking-wide">Step 3</span>
            <span className="text-xs text-[#166534]">FAR Study App이 키운 능력으로 TBS 해결</span>
          </div>
          <div className="px-4 py-4 bg-white">
            <div className="flex flex-col gap-1.5">
              {[
                '✅ "right of return" 트리거 즉시 인식 → 방향 결정',
                '✅ Variable consideration 언어화 → 분개 근거 서술 가능',
                '✅ 함정(전액 매출 인식) 오류 면역 → TBS 오답 회피',
                '✅ Error Pattern 기록으로 동일 실수 재발 방지',
              ].map((item, i) => (
                <p key={i} className="text-xs text-[#0f172a] leading-snug">{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 5. Ontology ───────────────────────────────────────────────
const ROOT_PATTERNS = [
  { id: 'E_ROOT_01', icon: '🧠', name: '개념 부재', color: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
  { id: 'E_ROOT_02', icon: '🔢', name: '계산 실수', color: '#FEF3C7', border: '#FCD34D', text: '#78350F' },
  { id: 'E_ROOT_03', icon: '📖', name: '독해 오류', color: '#FFF7ED', border: '#FDBA74', text: '#9A3412' },
];

const EXEC_EXAMPLES = ['기준서 혼동', '예외 조항 누락', '공식 잘못 적용', '부호 오류', '조건 누락', '숫자 선택 오류'];

function OntologySection() {
  return (
    <section
      className="rounded-2xl px-6 py-8 flex flex-col gap-6"
      style={{ background: '#0f172a' }}
    >
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-white/40 mb-1">Error Ontology</p>
        <h2 className="text-lg sm:text-xl font-bold text-white">
          내 실수 패턴을 구조적으로 추적한다
        </h2>
        <p className="text-xs text-white/60 mt-1">
          Spendit Finance Ops 방법론을 FAR 학습에 적용한 3-Layer 오류 분류 시스템
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Root layer */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2">
            Root Layer — 왜 틀렸나?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROOT_PATTERNS.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-3 flex flex-col items-center gap-1 text-center"
                style={{ background: r.color, border: `1px solid ${r.border}` }}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="text-xs font-bold" style={{ color: r.text }}>{r.name}</span>
                <span className="text-[9px] font-mono opacity-60" style={{ color: r.text }}>{r.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="text-center text-white/30 text-lg">↓</div>

        {/* Exec layer */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2">
            Exec Layer — 어디서 틀렸나?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXEC_EXAMPLES.map((e) => (
              <span
                key={e}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              >
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="text-center text-white/30 text-lg">↓</div>

        {/* Outcome */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40 mb-2">
            Outcome — 처방
          </p>
          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(60,142,255,0.15)', border: '1px solid rgba(60,142,255,0.3)' }}
          >
            {[
              '⛓️ 개념 → 함정 → 정답 접근법 체인 자동 생성',
              '📈 패턴별 발생 빈도 추적 → 반복 실수 유형 파악',
              '🎯 취약 유형 집중 퀴즈 자동 편성',
            ].map((item, i) => (
              <p key={i} className="text-xs text-white/80 leading-snug">{item}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 6. CTA ────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate();
  return (
    <section
      className="rounded-2xl px-6 py-10 flex flex-col items-center gap-6 text-center"
      style={{ background: BLUE_LIGHT, border: `1.5px solid ${BLUE_MID}` }}
    >
      <div>
        <h2 className="text-lg sm:text-xl font-bold" style={{ color: BLUE_DARK }}>
          지금 시작하면 TBS까지 준비됩니다
        </h2>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#3B6FBC' }}>
          MCQ 1문제를 6가지 방식으로 소화하는 루틴 — 오늘부터 시작하세요
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={() => navigate('/analyze')}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: BLUE }}
        >
          📝 문제 분석하러 가기
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 py-3 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
          style={{ background: 'white', border: `1.5px solid ${BLUE_MID}`, color: BLUE_DARK }}
        >
          📊 대시보드 보기
        </button>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LearningEffectPage() {
  return (
    <div className="p-4 sm:p-6 pb-12">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <HeroSection />
        <ComparisonSection />
        <TBSSection />
        <ExampleSection />
        <OntologySection />
        <CTASection />
      </div>
    </div>
  );
}
