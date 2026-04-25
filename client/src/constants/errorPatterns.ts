// SSOT: Error Pattern 카테고리 + 체인 매핑 정의
// ErrorTagSection, ErrorChainTab 모두 이 파일에서 import

export const ERROR_CATEGORIES = [
  { label: '개념 미이해', emoji: '📚', patternId: 'E_ROOT_01' },
  { label: '계산 실수',   emoji: '🔢', patternId: 'E_ROOT_02' },
  { label: '문제 해석 오류', emoji: '📖', patternId: 'E_ROOT_03' },
  { label: '기타',        emoji: '💭', patternId: null },
] as const

// category label → patternId mapping
export const CATEGORY_PATTERN_MAP: Record<string, string | null> = Object.fromEntries(
  ERROR_CATEGORIES.map((c) => [c.label, c.patternId])
)

export const ERROR_CHAIN: Record<string, { execs: string[]; outcomes: string[] }> = {
  E_ROOT_01: { execs: ['E_EXEC_01', 'E_EXEC_03', 'E_EXEC_04', 'E_EXEC_08'], outcomes: ['E_OUT_01', 'E_OUT_02'] },
  E_ROOT_02: { execs: ['E_EXEC_02', 'E_EXEC_05', 'E_EXEC_06', 'E_EXEC_08'], outcomes: ['E_OUT_02', 'E_OUT_03'] },
  E_ROOT_03: { execs: ['E_EXEC_01', 'E_EXEC_03', 'E_EXEC_04', 'E_EXEC_07'], outcomes: ['E_OUT_01', 'E_OUT_03'] },
}
