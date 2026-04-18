export interface Badge {
  emoji: string
  label: string
  level: number // 0=none,1=입문,2=학습 중,3=숙련,4=마스터
}

export function getBadge(conceptCount: number, quizAccuracy: number): Badge | null {
  if (conceptCount <= 0) return null
  if (conceptCount >= 10 && quizAccuracy >= 70) return { emoji: '🏆', label: '마스터', level: 4 }
  if (conceptCount >= 10) return { emoji: '⭐', label: '숙련', level: 3 }
  if (conceptCount >= 5) return { emoji: '📖', label: '학습 중', level: 2 }
  return { emoji: '🌱', label: '입문', level: 1 }
}

export const BADGE_CRITERIA = [
  { emoji: '🌱', label: '입문', desc: '개념 분석 1~4건', minCount: 1, minAcc: 0 },
  { emoji: '📖', label: '학습 중', desc: '개념 분석 5~9건', minCount: 5, minAcc: 0 },
  { emoji: '⭐', label: '숙련', desc: '개념 분석 10건 이상', minCount: 10, minAcc: 0 },
  { emoji: '🏆', label: '마스터', desc: '분석 10건 이상 + 퀴즈 정답률 70% 이상', minCount: 10, minAcc: 70 },
]
