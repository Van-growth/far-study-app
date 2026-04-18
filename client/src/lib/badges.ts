import { OntologyObjects } from './ontology'

export interface Badge {
  emoji: string
  label: string
  level: number // 0=none,1=입문,2=학습 중,3=숙련,4=마스터
}

const L = OntologyObjects.Badge.levels

export function getBadge(conceptCount: number, quizAccuracy: number): Badge | null {
  if (conceptCount <= 0) return null
  if (conceptCount >= L.master.minConcepts && quizAccuracy >= L.master.minAccuracy * 100)
    return { emoji: L.master.icon, label: L.master.label, level: 4 }
  if (conceptCount >= L.proficient.minConcepts)
    return { emoji: L.proficient.icon, label: L.proficient.label, level: 3 }
  if (conceptCount >= L.learning.minConcepts)
    return { emoji: L.learning.icon, label: L.learning.label, level: 2 }
  return { emoji: L.beginner.icon, label: L.beginner.label, level: 1 }
}

export const BADGE_CRITERIA = [
  { emoji: L.beginner.icon,   label: L.beginner.label,   desc: '개념 분석 1~4건',                          minCount: L.beginner.minConcepts,   minAcc: 0 },
  { emoji: L.learning.icon,   label: L.learning.label,   desc: '개념 분석 5~9건',                          minCount: L.learning.minConcepts,   minAcc: 0 },
  { emoji: L.proficient.icon, label: L.proficient.label, desc: '개념 분석 10건 이상',                      minCount: L.proficient.minConcepts, minAcc: 0 },
  { emoji: L.master.icon,     label: L.master.label,     desc: '분석 10건 이상 + 퀴즈 정답률 70% 이상',    minCount: L.master.minConcepts,     minAcc: L.master.minAccuracy * 100 },
]
