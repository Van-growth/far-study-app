import { supabase } from './supabase'

// ── 진도 ──────────────────────────────────────────────────────
export const getProgress = async (userId: string) => {
  const { data } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}

export const upsertProgress = async (
  userId: string,
  p: {
    topicId: string
    interval: number
    nextReview: number
    streak: number
    attempts: number
    correct: number
  },
) => {
  await supabase.from('topic_progress').upsert(
    {
      user_id: userId,
      topic_id: p.topicId,
      interval: p.interval,
      next_review: new Date(p.nextReview).toISOString(),
      streak: p.streak,
      attempts: p.attempts,
      correct: p.correct,
    },
    { onConflict: 'user_id,topic_id' },
  )
}

// ── 퀴즈 로그 ─────────────────────────────────────────────────
export const saveQuizLog = async (
  userId: string,
  log: {
    topicId: string
    topicLabel: string
    question: string
    options: string[]
    correct: boolean
    selected: number
    answer: number
    elapsedSeconds?: number | null
  },
) => {
  await supabase.from('quiz_logs').insert({
    user_id: userId,
    topic_id: log.topicId,
    topic_label: log.topicLabel,
    question: log.question,
    options: log.options,
    correct: log.correct,
    selected: log.selected,
    answer: log.answer,
    elapsed_seconds: log.elapsedSeconds ?? null,
  })
}

// ── 모듈별 성과 집계 (오답노트 상단용) ─────────────────────────
export interface ModulePerf {
  topicId: string
  total: number
  correct: number
  avgSeconds: number | null
}

export const getModulePerformance = async (
  userId: string,
): Promise<Record<string, ModulePerf>> => {
  const { data, error } = await supabase
    .from('quiz_logs')
    .select('topic_id, correct, elapsed_seconds')
    .eq('user_id', userId)
  if (error || !data) return {}

  const acc: Record<string, { topicId: string; total: number; correct: number; secSum: number; secCount: number }> = {}
  for (const row of data as { topic_id: string; correct: boolean; elapsed_seconds: number | null }[]) {
    const id = row.topic_id
    if (!id) continue
    if (!acc[id]) acc[id] = { topicId: id, total: 0, correct: 0, secSum: 0, secCount: 0 }
    acc[id].total++
    if (row.correct) acc[id].correct++
    // Exclude null AND any stray values >120s (cap). The client already
    // nulls >120 before insert, but this is a defensive belt for older rows.
    if (
      typeof row.elapsed_seconds === 'number' &&
      row.elapsed_seconds >= 0 &&
      row.elapsed_seconds <= 120
    ) {
      acc[id].secSum += row.elapsed_seconds
      acc[id].secCount++
    }
  }
  const out: Record<string, ModulePerf> = {}
  for (const [id, v] of Object.entries(acc)) {
    out[id] = {
      topicId: v.topicId,
      total: v.total,
      correct: v.correct,
      avgSeconds: v.secCount > 0 ? Math.round(v.secSum / v.secCount) : null,
    }
  }
  return out
}

export const getWrongLogs = async (userId: string, limit = 50) => {
  const { data } = await supabase
    .from('quiz_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('correct', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── 학습 세션 ─────────────────────────────────────────────────
export const updateTodaySession = async (
  userId: string,
  correct: boolean,
) => {
  await supabase.rpc('upsert_study_session', {
    p_user_id: userId,
    p_date: new Date().toISOString().split('T')[0],
    p_correct: correct,
  })
}

export const getCalendar = async (userId: string) => {
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)
  const { data } = await supabase
    .from('study_sessions')
    .select('date, quiz_count, correct_count')
    .eq('user_id', userId)
    .gte('date', from.toISOString().split('T')[0])
    .order('date', { ascending: true })
  return data ?? []
}
