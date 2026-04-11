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
  })
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
