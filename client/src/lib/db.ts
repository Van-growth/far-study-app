import { supabase } from './supabase'
import { localDateStr } from './date'

// ── Auth guard ────────────────────────────────────────────────
// All write helpers below check this first. If userId is missing, we
// skip the Supabase call entirely — without this, an unauthenticated
// write hits an RLS policy and returns 400, polluting the console and
// wasting a round trip.
//
// A valid Supabase UUID is 36 chars, but we only enforce "non-empty
// string that looks uuid-ish" so that test fixtures still work.
function hasAuth(userId: string | null | undefined): userId is string {
  if (typeof userId !== 'string') return false
  const trimmed = userId.trim()
  if (trimmed.length < 10) return false
  return true
}

function logSkip(fn: string) {
  console.warn(`[db] ${fn} skipped — no authenticated user`)
}

// Supabase error objects sometimes include extra context (details, hint,
// code). Dump the whole thing so we can distinguish RLS/NOT NULL/missing
// column failures at a glance in DevTools.
function logError(fn: string, error: unknown) {
  if (error && typeof error === 'object') {
    console.warn(`[db] ${fn} failed:`, {
      message: (error as { message?: string }).message,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
      code: (error as { code?: string }).code,
    })
  } else {
    console.warn(`[db] ${fn} failed:`, error)
  }
}

// ── 진도 ──────────────────────────────────────────────────────
export const getProgress = async (userId: string) => {
  const { data } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
  return data ?? []
}

// Coerce potentially-partial SRS card data into a shape that always
// satisfies every NOT NULL column on `topic_progress`. This protects
// against:
//   · Old persisted state from localStorage missing a field
//   · NaN/Infinity values that JSON.stringify would drop
//   · Production schemas where column defaults have been removed
//     (Postgres 23502 not_null_violation observed in the wild)
const safeInt = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const safeIsoFromMs = (ms: unknown): string => {
  if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
    return new Date(ms).toISOString()
  }
  return new Date().toISOString()
}

// topicId "F1-M3" → "F1". Returns null for malformed input so the caller
// can decide to skip the write instead of sending a bogus area_id.
function areaIdFromTopic(topicId: string): string | null {
  if (!topicId) return null
  const head = topicId.split('-')[0]
  return head && /^F\d$/.test(head) ? head : null
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
  if (!hasAuth(userId)) return logSkip('upsertProgress')
  if (!p.topicId) return
  const areaId = areaIdFromTopic(p.topicId)
  if (!areaId) {
    console.warn('[db] upsertProgress skipped — invalid topicId format:', p.topicId)
    return
  }
  const { error } = await supabase.from('topic_progress').upsert(
    {
      user_id: userId,
      topic_id: p.topicId,
      area_id: areaId,
      interval: safeInt(p.interval, 0),
      next_review: safeIsoFromMs(p.nextReview),
      streak: safeInt(p.streak, 0),
      attempts: safeInt(p.attempts, 0),
      correct: safeInt(p.correct, 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,topic_id' },
  )
  if (error) {
    logError('upsertProgress', error)
    throw error
  }
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
  if (!hasAuth(userId)) return logSkip('saveQuizLog')
  const { error } = await supabase.from('quiz_logs').insert({
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
  if (error) {
    logError('saveQuizLog', error)
    throw error
  }
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

// Used by the AI coach — lightweight quiz meta summary.
export const getQuizMeta = async (
  userId: string,
): Promise<{ totalSolved: number; lastActive: string | null }> => {
  const [countRes, lastRes] = await Promise.all([
    supabase.from('quiz_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('quiz_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),
  ])
  const lastRow = (lastRes.data && lastRes.data[0]) as { created_at?: string } | undefined
  return {
    totalSolved: countRes.count ?? 0,
    lastActive: lastRow?.created_at ?? null,
  }
}

// Consolidated bootstrap for the AI coach: detects which scenario the
// student is in (first use / first today / continuing / returning) and
// surfaces the handful of fields the prompt needs.
export interface CoachBootstrap {
  totalSolved: number
  lastActive: string | null
  daysSinceLastActive: number | null
  todayCount: number
  todayCorrect: number
  todayAvgSeconds: number | null
  todayBreakdown: { moduleId: string; total: number; correct: number; avgSec: number | null }[]
  lastSolvedModuleId: string | null
  lastSolvedModuleCorrectRate: number | null
}

export const getCoachBootstrap = async (userId: string): Promise<CoachBootstrap> => {
  const [logsRes, countRes] = await Promise.all([
    supabase
      .from('quiz_logs')
      .select('topic_id, correct, elapsed_seconds, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('quiz_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const logs = (logsRes.data ?? []) as {
    topic_id: string
    correct: boolean
    elapsed_seconds: number | null
    created_at: string
  }[]
  const totalSolved = countRes.count ?? logs.length

  if (logs.length === 0) {
    return {
      totalSolved: 0,
      lastActive: null,
      daysSinceLastActive: null,
      todayCount: 0,
      todayCorrect: 0,
      todayAvgSeconds: null,
      todayBreakdown: [],
      lastSolvedModuleId: null,
      lastSolvedModuleCorrectRate: null,
    }
  }

  const lastActive = logs[0].created_at
  const daysSinceLastActive = Math.floor(
    (Date.now() - new Date(lastActive).getTime()) / (24 * 60 * 60 * 1000),
  )

  // Local-day boundary
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayLogs = logs.filter((l) => new Date(l.created_at) >= todayStart)

  const byModule: Record<
    string,
    { total: number; correct: number; secSum: number; secCount: number }
  > = {}
  for (const l of todayLogs) {
    const id = l.topic_id
    if (!id) continue
    if (!byModule[id]) byModule[id] = { total: 0, correct: 0, secSum: 0, secCount: 0 }
    byModule[id].total++
    if (l.correct) byModule[id].correct++
    if (
      typeof l.elapsed_seconds === 'number' &&
      l.elapsed_seconds >= 0 &&
      l.elapsed_seconds <= 120
    ) {
      byModule[id].secSum += l.elapsed_seconds
      byModule[id].secCount++
    }
  }
  const todayBreakdown = Object.entries(byModule)
    .map(([moduleId, v]) => ({
      moduleId,
      total: v.total,
      correct: v.correct,
      avgSec: v.secCount > 0 ? Math.round(v.secSum / v.secCount) : null,
    }))
    .sort((a, b) => b.total - a.total)

  const todayCount = todayLogs.length
  const todayCorrect = todayLogs.filter((l) => l.correct).length
  const todaySecVals = todayLogs
    .map((l) => l.elapsed_seconds)
    .filter((s): s is number => typeof s === 'number' && s >= 0 && s <= 120)
  const todayAvgSeconds =
    todaySecVals.length > 0
      ? Math.round(todaySecVals.reduce((a, b) => a + b, 0) / todaySecVals.length)
      : null

  const lastSolvedModuleId = logs[0].topic_id ?? null
  let lastSolvedModuleCorrectRate: number | null = null
  if (lastSolvedModuleId) {
    const todayStat = byModule[lastSolvedModuleId]
    if (todayStat) {
      lastSolvedModuleCorrectRate = Math.round((todayStat.correct / todayStat.total) * 100)
    } else {
      // Fall back to all fetched logs for that module (up to 500 recent)
      const modLogs = logs.filter((l) => l.topic_id === lastSolvedModuleId)
      if (modLogs.length > 0) {
        const c = modLogs.filter((l) => l.correct).length
        lastSolvedModuleCorrectRate = Math.round((c / modLogs.length) * 100)
      }
    }
  }

  return {
    totalSolved,
    lastActive,
    daysSinceLastActive,
    todayCount,
    todayCorrect,
    todayAvgSeconds,
    todayBreakdown,
    lastSolvedModuleId,
    lastSolvedModuleCorrectRate,
  }
}

// Distinct moduleIds from the most recent wrong answers.
export const getRecentWrongModules = async (
  userId: string,
  limit = 5,
): Promise<string[]> => {
  const { data } = await supabase
    .from('quiz_logs')
    .select('topic_id')
    .eq('user_id', userId)
    .eq('correct', false)
    .order('created_at', { ascending: false })
    .limit(50)
  if (!data) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of data as { topic_id: string }[]) {
    if (row.topic_id && !seen.has(row.topic_id)) {
      seen.add(row.topic_id)
      out.push(row.topic_id)
      if (out.length >= limit) break
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
// Dates are stored/queried in the user's LOCAL timezone (YYYY-MM-DD).
// toISOString() would flip to UTC and roll the date back to "yesterday"
// any morning before UTC-midnight — which was every KST morning — making
// writes land on the wrong day and the heatmap jump cells.
export const updateTodaySession = async (
  userId: string,
  correct: boolean,
) => {
  if (!hasAuth(userId)) return logSkip('updateTodaySession')
  const { error } = await supabase.rpc('upsert_study_session', {
    p_user_id: userId,
    p_date: localDateStr(),
    p_correct: correct,
  })
  if (error) {
    logError('updateTodaySession', error)
    throw error
  }
}

export const getCalendar = async (userId: string) => {
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)
  const { data, error } = await supabase
    .from('study_sessions')
    .select('date, quiz_count, correct_count')
    .eq('user_id', userId)
    .gte('date', localDateStr(from))
    .order('date', { ascending: true })
  if (error) {
    console.warn('[db] getCalendar failed:', error.message)
    return []
  }
  // Normalize date strings to YYYY-MM-DD so the heatmap's Map lookup
  // matches regardless of whether PostgREST returns a bare date or an
  // ISO timestamp like "2026-04-12T00:00:00+00:00".
  return (data ?? []).map((row) => ({
    ...row,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
  }))
}
