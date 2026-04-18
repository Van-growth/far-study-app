import { useState } from 'react';

type Tab = 'advantage' | 'flywheel' | 'ontology';

const TABS: { id: Tab; label: string }[] = [
  { id: 'advantage', label: '학습 방식 장점' },
  { id: 'flywheel', label: '데이터 강화학습' },
  { id: 'ontology', label: '온톨로지 구조' },
];

// ── Tab 1: 학습 방식 장점 ─────────────────────────────────────
const COMPARE_ROWS = [
  { feature: '문제 출처', becker: 'Becker 고정 문제풀이', app: '내 오답 패턴 기반 출제' },
  { feature: '해설 언어', becker: '영어 원문', app: '한국어 최적화 구조화 해설' },
  { feature: 'AI 활용', becker: '없음', app: '풀수록 정확해지는 Claude 분석' },
  { feature: '오류 분석', becker: '정답/오답 이진 피드백', app: '3-layer 오류 패턴 태깅' },
  { feature: '개념 누적', becker: '없음', app: 'concept_extractions DB 자동 누적' },
  { feature: '취약점 파악', becker: '정답률 통계', app: 'concept_stats × Error Pattern 교차 분석' },
];

const FEATURES = [
  {
    icon: '🎯',
    title: '내 오답 기반 출제',
    desc: '틀린 문제의 개념(concepts) + 함정(trap_pattern)을 추출해 퀴즈 생성 프롬프트에 자동 주입. 내가 약한 곳만 반복 노출.',
  },
  {
    icon: '🇰🇷',
    title: '한국어 최적화 해설',
    desc: 'Becker 영어 원문을 Claude가 재구조화. 계정과목은 영어 유지, 개념 설명·흐름·함정 포인트는 한국어로 압축.',
  },
  {
    icon: '📈',
    title: '쓸수록 정확해지는 AI',
    desc: '분석할수록 concept_extractions가 쌓이고, 퀴즈를 풀수록 concept_stats가 정밀해진다. 데이터가 많을수록 AI 브리핑과 퀴즈 품질이 올라간다.',
  },
  {
    icon: '🔍',
    title: '오류 패턴 3-layer 분석',
    desc: 'Root(개념 부재·계산 실수·독해 오류) → Exec(세부 패턴) 2단계 태깅으로 내가 반복하는 실수 유형을 구조화해서 추적.',
  },
];

function AdvantageTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* 비교표 */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-[#0f172a]">Becker vs FAR Study App</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th className="text-left px-4 py-2.5 text-muted font-semibold w-1/4">항목</th>
                <th className="text-left px-4 py-2.5 text-muted font-semibold w-[37.5%]">Becker</th>
                <th className="text-left px-4 py-2.5 font-semibold w-[37.5%]" style={{ color: '#4f6ef7' }}>FAR Study App</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? '' : ''} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td className="px-4 py-2.5 font-medium text-[#0f172a]">{row.feature}</td>
                  <td className="px-4 py-2.5 text-muted">{row.becker}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#4f6ef7' }}>{row.app}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 핵심 기능 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm font-semibold text-[#0f172a]">{f.title}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: 데이터 강화학습 ────────────────────────────────────
const FLYWHEEL_STEPS = [
  { icon: '📄', label: 'Becker 문제 입력', sub: '문제 원문 붙여넣기' },
  { icon: '🤖', label: 'Claude 분석', sub: 'concept-card + extract-concepts' },
  { icon: '💾', label: 'concept_extractions', sub: '개념·함정·ASC 참조 누적' },
  { icon: '💉', label: 'WEAK 개념 주입', sub: '취약 개념을 퀴즈 프롬프트에 삽입' },
  { icon: '✏️', label: '인터리빙 퀴즈', sub: '약점 집중 문제 자동 출제' },
  { icon: '📊', label: 'concept_stats', sub: '태그별 정답률 누적' },
  { icon: '💬', label: 'AI 브리핑', sub: '오늘의 취약 개념·개선 모듈 진단' },
];

const GROWTH_STAGES = [
  {
    count: '190개+',
    label: '현재',
    desc: '기본 분석 루프 가동 중. 취약 개념 주입 시작.',
    color: '#e0f2fe',
    border: '#7dd3fc',
    text: '#075985',
  },
  {
    count: '390개+',
    label: '주말 목표',
    desc: '모듈별 concept_stats 충분 → 가장 약한 토픽 자동 감지.',
    color: '#f0fdf4',
    border: '#86efac',
    text: '#166534',
  },
  {
    count: '500개+',
    label: '시험 직전',
    desc: 'Error Pattern × 개념 교차 분석으로 반복 실수 유형 완전 파악.',
    color: '#eef2ff',
    border: '#c7d2fe',
    text: '#3730a3',
  },
];

function FlywheelTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* 플라이휠 흐름도 */}
      <div className="card rounded-xl p-4">
        <p className="text-sm font-semibold text-[#0f172a] mb-4">🔄 데이터 플라이휠</p>
        <div className="flex flex-col gap-0">
          {FLYWHEEL_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe' }}
                >
                  {step.icon}
                </div>
                {i < FLYWHEEL_STEPS.length - 1 && (
                  <div className="w-[1.5px] h-5 mt-0.5" style={{ background: '#c7d2fe' }} />
                )}
              </div>
              <div className="pt-1.5 pb-4">
                <p className="text-xs font-semibold text-[#0f172a]">{step.label}</p>
                <p className="text-[11px] text-muted mt-0.5">{step.sub}</p>
              </div>
            </div>
          ))}
          {/* 루프 표시 */}
          <div className="ml-4 mt-1 text-[11px] text-[#4f6ef7] font-medium">
            ↺ 분석할수록 루프가 강해집니다
          </div>
        </div>
      </div>

      {/* 데이터 성장 단계 */}
      <div>
        <p className="text-sm font-semibold text-[#0f172a] mb-3">📦 데이터 성장 단계</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GROWTH_STAGES.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 flex flex-col gap-1"
              style={{ background: s.color, border: `1px solid ${s.border}` }}
            >
              <p className="text-2xl font-bold" style={{ color: s.text }}>{s.count}</p>
              <p className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</p>
              <p className="text-[11px] leading-relaxed mt-1" style={{ color: s.text, opacity: 0.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: 온톨로지 구조 ──────────────────────────────────────
const ROOT_PATTERNS = [
  { id: 'E_ROOT_01', icon: '🧠', name: '개념 부재', desc: '해당 규정/기준 자체를 모르는 상태' },
  { id: 'E_ROOT_02', icon: '🔢', name: '계산 실수', desc: '개념은 알지만 산술/단위/부호 오류' },
  { id: 'E_ROOT_03', icon: '📖', name: '독해 오류', desc: '문제 조건을 잘못 읽거나 놓침' },
];

const EXEC_PATTERNS = [
  { id: 'E_EXEC_01', name: '기준서 혼동', root: 'E_ROOT_01' },
  { id: 'E_EXEC_02', name: '예외 조항 누락', root: 'E_ROOT_01' },
  { id: 'E_EXEC_03', name: '분류 오류', root: 'E_ROOT_01' },
  { id: 'E_EXEC_04', name: '공식 잘못 적용', root: 'E_ROOT_02' },
  { id: 'E_EXEC_05', name: '단위 혼동', root: 'E_ROOT_02' },
  { id: 'E_EXEC_06', name: '부호 오류', root: 'E_ROOT_02' },
  { id: 'E_EXEC_07', name: '조건 누락', root: 'E_ROOT_03' },
  { id: 'E_EXEC_08', name: '숫자 선택 오류', root: 'E_ROOT_03' },
  { id: 'E_EXEC_09', name: '계산 실수', root: 'E_ROOT_02' },
];

const CHAIN_STEPS = [
  { icon: '💡', label: '개념 (Concept)', desc: 'ASC 코드·회계 기준·계산 공식' },
  { icon: '⚠️', label: '함정 (Trap)', desc: '수험생이 자주 걸리는 오해 패턴' },
  { icon: '💊', label: '처방 (Approach)', desc: '올바른 접근법 한 줄 요약' },
];

function OntologyTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* 3-layer 구조 */}
      <div className="card rounded-xl p-4">
        <p className="text-sm font-semibold text-[#0f172a] mb-4">🔍 3-Layer Error Pattern</p>

        {/* Root layer */}
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Root — 원인 분류</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {ROOT_PATTERNS.map((r) => (
            <div
              key={r.id}
              className="rounded-lg p-3 flex flex-col gap-1"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{r.icon}</span>
                <span className="text-xs font-semibold text-[#991b1b]">{r.name}</span>
              </div>
              <p className="text-[11px] text-[#7f1d1d] opacity-80">{r.desc}</p>
              <span className="text-[9px] font-mono text-[#991b1b] opacity-60">{r.id}</span>
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="text-center text-muted text-sm mb-4">↓ 세부 패턴 선택 (Exec layer)</div>

        {/* Exec layer */}
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Exec — 세부 패턴</p>
        <div className="flex flex-wrap gap-1.5">
          {EXEC_PATTERNS.map((e) => (
            <span
              key={e.id}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412' }}
            >
              {e.name}
              <span className="ml-1 opacity-50 font-mono text-[9px]">{e.id.replace('E_EXEC_', '#')}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 개념 → 함정 → 처방 체인 */}
      <div className="card rounded-xl p-4">
        <p className="text-sm font-semibold text-[#0f172a] mb-4">⛓️ 개념 → 함정 → 처방 체인</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {CHAIN_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className="rounded-xl p-3 flex flex-col gap-1 flex-1"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{step.icon}</span>
                  <span className="text-xs font-semibold text-[#0f172a]">{step.label}</span>
                </div>
                <p className="text-[11px] text-muted">{step.desc}</p>
              </div>
              {i < CHAIN_STEPS.length - 1 && (
                <span className="text-muted text-sm shrink-0 hidden sm:block">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3 leading-relaxed">
          Claude가 분석 시 concept_extractions에 concepts + trap_pattern을 추출하고,
          concept-card에서 correct_approach를 생성합니다. 이 3요소가 퀴즈 프롬프트에 주입되어
          취약 개념을 처방까지 연결하는 루프를 형성합니다.
        </p>
      </div>

      {/* Spendit 이식 */}
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ background: '#fafaf9', border: '1px solid #e7e5e4' }}
      >
        <p className="text-sm font-semibold text-[#0f172a]">🏗️ Spendit Finance Ops Ontology 이식</p>
        <p className="text-xs text-muted leading-relaxed">
          이 구조는 Spendit의 Finance Ops 지식 온톨로지(비용 분류 → 오류 패턴 → 처방 → 자동화 트리거)를
          USCPA FAR 수험 도메인으로 이식한 것입니다. 엔티티-관계 모델링 대신
          <strong className="text-[#0f172a]"> 인지 흐름 중심</strong>으로 재설계했습니다.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { from: 'Finance Ops 비용 분류', to: 'FAR 회계 개념 체계' },
            { from: '오류 유형 태그', to: 'Error Pattern 3-layer' },
            { from: '처방 룰 엔진', to: 'correct_approach 생성' },
            { from: '자동화 트리거', to: '취약 개념 퀴즈 주입' },
          ].map((m, i) => (
            <div key={i} className="text-[11px] flex items-center gap-1.5">
              <span className="text-muted shrink-0">{m.from}</span>
              <span className="text-muted shrink-0">→</span>
              <span className="font-medium text-[#0f172a]">{m.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LearningEffectPage() {
  const [tab, setTab] = useState<Tab>('advantage');

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">📈 학습 효과</h1>
          <p className="text-xs text-muted mt-0.5">
            FAR Study App이 Becker 단순 반복보다 효과적인 이유와 데이터 구조
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: '#f1f5f9' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={
                tab === t.id
                  ? { background: 'white', color: '#4f6ef7', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#64748b' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'advantage' && <AdvantageTab />}
        {tab === 'flywheel' && <FlywheelTab />}
        {tab === 'ontology' && <OntologyTab />}
      </div>
    </div>
  );
}
