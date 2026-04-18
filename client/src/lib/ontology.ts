// ============================================================
// FAR Study App — Learning Ontology v1.0
// Palantir-style Object / Property / Link / Action 정의
//
// 목적: 데이터 간 관계와 자동화 규칙을 코드로 명시
//       Claude Code가 새 기능 개발 시 이 파일을 참조 기준으로 사용
// ============================================================

// ── Objects ──────────────────────────────────────────────────

export const OntologyObjects = {

  Concept: {
    description: "Becker 문제에서 추출된 학습 개념 단위",
    table: "concept_extractions",
    properties: {
      concepts:         { type: "string[]", desc: "핵심 개념 태그 목록" },
      trap_pattern:     { type: "string",   desc: "이 문제의 구체적 함정 서술" },
      triggers:         { type: "jsonb[]",  desc: "keyword→auto_rule→trap→comparison 반응 규칙" },
      asc_references:   { type: "string[]", desc: "관련 ASC 조항" },
      correct_approach: { type: "string",   desc: "정답 접근법 한 줄" },
      topic_tags:       { type: "string[]", desc: "세부 분류 태그" },
      topic_id:         { type: "string",   desc: "모듈 ID (예: F3-M3)" },
      question_hash:    { type: "string",   desc: "중복 방지 SHA-256 해시" },
      was_wrong:        { type: "boolean",  desc: "내가 틀린 문제 여부" },
    },
    weakThreshold: 0.5,
    masterThreshold: 0.8,
  },

  Trigger: {
    description: "키워드 감지 → 자동 반응 규칙. Concept에 embedded.",
    embeddedIn: "concept_extractions.triggers",
    properties: {
      keyword:     { type: "string", desc: "문제에서 감지할 핵심 단어/구문" },
      auto_rule:   { type: "string", desc: "이 키워드 보면 자동으로 취해야 할 행동" },
      trap:        { type: "string", desc: "가장 많이 틀리는 오해/함정" },
      comparison:  { type: "string", desc: "헷갈리는 유사 개념과 비교" },
      irrelevant:  { type: "string", desc: "문제에서 무시해도 되는 데이터" },
    },
  },

  ErrorPattern: {
    description: "왜 틀렸는가를 3-layer로 구조화한 오류 단위",
    tables: ["attempt_errors", "error_patterns", "pattern_stats"],
    layers: {
      root:    { desc: "근본 원인 (개념미이해/독해실수/계산실수)" },
      exec:    { desc: "실행 오류 (특정 계산/분류 실수) — 현재 미사용, triggers로 대체 예정" },
      outcome: { desc: "결과 지표 (정확도정체/시험위험/효율저하)" },
    },
    properties: {
      pattern_id:   { type: "string",  desc: "E_ROOT_01 등 패턴 ID" },
      user_note:    { type: "string",  desc: "사용자 자가진단 내용" },
      ai_diagnosis: { type: "string",  desc: "AI 평가 및 체크포인트" },
      occurrence:   { type: "number",  desc: "총 발생 횟수" },
      recent_rate:  { type: "number",  desc: "최근 7일 발생 비율" },
      improvement:  { type: "number",  desc: "지난주 대비 개선율 (양수=개선)" },
    },
  },

  Performance: {
    description: "concept/trap 태그별 정답률 누적 데이터",
    tables: ["concept_stats", "quiz_logs"],
    properties: {
      tag:           { type: "string",  desc: "concept 또는 trap_pattern 값" },
      tag_type:      { type: "string",  desc: "'concept' | 'trap'" },
      total_count:   { type: "number",  desc: "총 출제 횟수" },
      correct_count: { type: "number",  desc: "정답 횟수" },
      accuracy:      { type: "number",  desc: "correct_count / total_count" },
      topic_id:      { type: "string",  desc: "모듈 ID" },
    },
  },

  Badge: {
    description: "모듈별 학습 달성 뱃지",
    derivedFrom: ["concept_extractions", "concept_stats"],
    levels: {
      none:       { minConcepts: 0,  minAccuracy: 0,    icon: "—",  label: "미시작" },
      beginner:   { minConcepts: 1,  minAccuracy: 0,    icon: "🌱", label: "입문" },
      learning:   { minConcepts: 5,  minAccuracy: 0,    icon: "📖", label: "학습 중" },
      proficient: { minConcepts: 10, minAccuracy: 0,    icon: "⭐", label: "숙련" },
      master:     { minConcepts: 10, minAccuracy: 0.7,  icon: "🏆", label: "마스터" },
    },
  },

} as const

// ── Links ─────────────────────────────────────────────────────

export const OntologyLinks = {

  weak_in: {
    from: "Performance",
    to: "Concept",
    description: "정답률이 임계값 이하인 concept는 WEAK 상태",
    condition: (accuracy: number) => accuracy < OntologyObjects.Concept.weakThreshold,
    effect: "questionGenerator의 WEAK CONCEPTS 섹션에 자동 주입",
  },

  master_of: {
    from: "Performance",
    to: "Concept",
    description: "정답률이 마스터 임계값 이상인 concept",
    condition: (accuracy: number) => accuracy >= OntologyObjects.Concept.masterThreshold,
    effect: "WEAK 목록에서 제거 + Badge 승급",
  },

  caused_by: {
    from: "ErrorPattern",
    to: "Concept",
    description: "오류 패턴은 특정 concept 미숙지로 인해 발생",
    via: "topic_id + pattern_id",
    effect: "AI 브리핑에서 해당 concept 집중 처방",
  },

  prevents: {
    from: "Trigger",
    to: "ErrorPattern",
    description: "트리거 내재화 → 동일 오류 패턴 재발 방지",
    via: "keyword ↔ trap_pattern 매핑",
    effect: "concept_stats 정답률 상승으로 측정",
  },

  belongs_to: {
    from: "Concept",
    to: "Module",
    description: "concept은 특정 FAR 모듈에 속함",
    via: "topic_id",
    effect: "모듈별 커버리지 + 뱃지 계산",
  },

} as const

// ── Actions ───────────────────────────────────────────────────

export const OntologyActions = {

  onConceptSaved: {
    trigger: "concept_extractions INSERT",
    description: "새 concept 저장 시",
    steps: [
      "concept_stats upsert (tag별 정답률 초기화)",
      "question_hash 중복 체크",
      "topicInference로 topic_id 보정",
      "WEAK 목록 재평가",
    ],
    implementedIn: ["db.ts:saveConceptExtraction", "AnalyzePage.tsx:handleAnalyze"],
  },

  onQuizAnswered: {
    trigger: "quiz_logs INSERT",
    description: "퀴즈 답 제출 시",
    steps: [
      "concept_stats correct_count/total_count 업데이트",
      "accuracy 재계산",
      "weak_in Link 조건 평가",
      "master_of Link 조건 평가 → Badge 승급",
    ],
    implementedIn: ["db.ts:saveQuizLog", "QuizView.tsx:handleSubmit"],
  },

  onErrorTagged: {
    trigger: "attempt_errors INSERT",
    description: "오류 패턴 태깅 시",
    steps: [
      "pattern_stats occurrence +1",
      "caused_by Link 형성",
      "AI 브리핑 우선순위 상승",
    ],
    implementedIn: ["db.ts:tagAttemptError", "ErrorTagSection.tsx"],
  },

  onDailyBriefing: {
    trigger: "홈 화면 접속 (일 1회)",
    description: "AI 튜터 브리핑 생성",
    steps: [
      "WEAK concept 목록 조회 (weak_in Links)",
      "top ErrorPattern 조회",
      "개선 중인 모듈 감지 (master_of Links 진행 중)",
      "Claude API로 오늘 처방 생성",
      "localStorage 캐싱",
    ],
    implementedIn: ["HomePage.tsx:TutorBriefing", "server/routes/tutor.ts"],
  },

  onWeakThresholdBreached: {
    trigger: "concept_stats accuracy < 0.5",
    description: "약점 감지 시",
    steps: [
      "weak_in Link 활성화",
      "questionGenerator WEAK 섹션에 keyword/trap 주입",
      "AI 브리핑 처방에 포함",
    ],
    implementedIn: ["questionGenerator.ts:getWeakConcepts"],
  },

  onMasterThresholdReached: {
    trigger: "concept_stats accuracy >= 0.8 AND concept_count >= 10",
    description: "마스터 달성 시",
    steps: [
      "WEAK 목록에서 제거",
      "Badge level → master 승급",
      "토스트: 'F3-M3 마스터 달성!'",
    ],
    implementedIn: ["badges.ts:getBadge", "AnalyzePage.tsx:badge toast"],
  },

} as const

// ── Helper Types ──────────────────────────────────────────────

export type BadgeLevel = keyof typeof OntologyObjects.Badge.levels
export type LinkType = keyof typeof OntologyLinks
export type ActionType = keyof typeof OntologyActions

// ── Module Registry ───────────────────────────────────────────

export const FAR_MODULES = {
  F1: {
    label: "Financial Reporting",
    modules: ["M1","M2","M3","M4","M5","M6","M7","M8"],
  },
  F2: {
    label: "Financial Reporting (Cont.)",
    modules: ["M1","M2","M3","M4","M5","M6","M7","M8"],
  },
  F3: {
    label: "Assets and Related Topics",
    modules: ["M1","M2","M3","M4","M5","M6"],
  },
  F4: {
    label: "Liabilities",
    modules: ["M1","M2","M3","M4","M5","M6","M7"],
  },
  F5: {
    label: "Investments and Other Topics",
    modules: ["M1","M2","M3","M4","M5","M6","M7"],
  },
  F6: {
    label: "NFP & Governmental",
    modules: ["M1","M2","M3","M4","M5","M6"],
  },
} as const

export const TOTAL_MODULES = Object.values(FAR_MODULES)
  .reduce((acc, part) => acc + part.modules.length, 0) // 42

// ── Usage Guide (for Claude Code) ────────────────────────────
//
// 새 기능 개발 시 반드시 이 파일을 먼저 참조할 것:
//
// 1. 새 데이터 저장 로직 → OntologyActions 확인
// 2. 새 UI 컴포넌트 → OntologyObjects 확인
// 3. 데이터 간 관계 쿼리 → OntologyLinks 확인
// 4. 임계값 변경 → OntologyObjects.Concept.weakThreshold 수정
