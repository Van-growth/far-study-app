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
// ── Feature detection: quiz_logs.elapsed_seconds ─────────────
// The column was added in migration 002. If a deployment hasn't run
// that migration yet, every write/read that references the column
// fails with PGRST204 ("column not in schema cache"). Instead of
// blocking the whole app, we probe once per session and cache the
// result. All timing-related code then gracefully degrades when the
// column is missing — the student can still quiz; only the timing
// metrics are skipped until the migration is applied.
let elapsedSecondsSupported: boolean | null = null
let elapsedSecondsProbe: Promise<boolean> | null = null

export async function hasElapsedSecondsColumn(): Promise<boolean> {
  if (elapsedSecondsSupported !== null) return elapsedSecondsSupported
  if (elapsedSecondsProbe) return elapsedSecondsProbe
  elapsedSecondsProbe = (async () => {
    const { error } = await supabase
      .from('quiz_logs')
      .select('elapsed_seconds')
      .limit(1)
    if (error) {
      const msg = (error.message ?? '').toLowerCase()
      const code = (error as { code?: string }).code ?? ''
      const isMissing =
        code === 'PGRST204' ||
        code === '42703' ||
        msg.includes('elapsed_seconds') ||
        msg.includes('schema cache')
      if (isMissing) {
        console.warn(
          '[db] quiz_logs.elapsed_seconds missing — timing metrics disabled. ' +
            'Run supabase/migrations/002_quiz_logs_elapsed_seconds.sql to enable.',
        )
        elapsedSecondsSupported = false
      } else {
        // Unknown error — assume column exists and let the caller surface it.
        elapsedSecondsSupported = true
      }
    } else {
      elapsedSecondsSupported = true
    }
    return elapsedSecondsSupported
  })()
  return elapsedSecondsProbe
}

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
    sourceConcepts?: string[] | null
    sourceTrap?: string | null
  },
) => {
  if (!hasAuth(userId)) return logSkip('saveQuizLog')
  const areaId = areaIdFromTopic(log.topicId)
  if (!areaId) {
    console.warn('[db] saveQuizLog skipped — invalid topicId format:', log.topicId)
    return
  }
  const hasCol = await hasElapsedSecondsColumn()
  const payload: Record<string, unknown> = {
    user_id: userId,
    topic_id: log.topicId,
    area_id: areaId,
    topic_label: log.topicLabel,
    question: log.question,
    options: log.options,
    correct: log.correct,
    selected: log.selected,
    answer: log.answer,
  }
  if (hasCol) {
    payload.elapsed_seconds = log.elapsedSeconds ?? null
  }
  // Last-line defence: if area_id was somehow stripped (HMR remnant /
  // bundle cache / accidental object spread), force-inject it before
  // hitting Supabase. Logs to console so any future regression is
  // immediately visible.
  if (!payload.area_id) {
    console.warn('[db] saveQuizLog payload missing area_id — re-injecting from topic_id')
    payload.area_id = areaId
  }
  const { error } = await supabase.from('quiz_logs').insert(payload)
  if (error) {
    logError('saveQuizLog', error)
    throw error
  }

  // concept_stats 누적 — quiz_logs 저장 성공 후에만. 실패해도 quiz_logs 저장은
  // 이미 끝났으므로 throw 하지 않고 경고만 남긴다.
  const concepts = (log.sourceConcepts ?? []).filter(
    (c): c is string => typeof c === 'string' && c.trim().length > 0,
  )
  const trap =
    typeof log.sourceTrap === 'string' && log.sourceTrap.trim().length > 0
      ? log.sourceTrap.trim()
      : null
  if (concepts.length || trap) {
    await updateConceptStats(log.topicId, log.correct, { concepts, trap })
  }
}

// ── concept_stats — 태그별 누적 정답률 ────────────────────────
// Migration 006 의 concept_stats_increment RPC 를 호출해 atomic upsert.
// RPC 가 아직 배포 안 된 환경에서는 첫 호출 시 경고 후 자동 비활성화.
let conceptStatsSupported: boolean | null = null

const updateConceptStats = async (
  topicId: string,
  correct: boolean,
  tags: { concepts: string[]; trap: string | null },
) => {
  if (conceptStatsSupported === false) return

  const rows: { tag: string; tag_type: 'concept' | 'trap' }[] = [
    ...tags.concepts.map((c) => ({ tag: c, tag_type: 'concept' as const })),
    ...(tags.trap ? [{ tag: tags.trap, tag_type: 'trap' as const }] : []),
  ]
  if (!rows.length) return

  const results = await Promise.allSettled(
    rows.map((r) =>
      supabase.rpc('concept_stats_increment', {
        p_tag: r.tag,
        p_tag_type: r.tag_type,
        p_topic_id: topicId,
        p_is_correct: correct,
      }),
    ),
  )

  for (const res of results) {
    if (res.status === 'rejected') {
      console.warn('[db] concept_stats_increment rejected:', res.reason)
      continue
    }
    const err = (res.value as { error?: { message?: string; code?: string } | null })?.error
    if (err) {
      const msg = (err.message ?? '').toLowerCase()
      if (
        err.code === 'PGRST202' ||
        err.code === '42883' ||
        msg.includes('does not exist') ||
        msg.includes('function concept_stats_increment')
      ) {
        conceptStatsSupported = false
        console.warn(
          '[db] concept_stats_increment RPC missing — 누적 정답률 비활성화. ' +
            'Run supabase/migrations/006_concept_stats.sql to enable.',
        )
        return
      }
      console.warn('[db] concept_stats_increment error:', err)
    }
  }
  conceptStatsSupported = true
}

export interface ConceptStat {
  tag: string
  tagType: 'concept' | 'trap'
  topicId: string | null
  total: number
  correct: number
  accuracy: number
  lastSeenAt: string
}

export const getConceptStats = async (
  userId: string,
  topicId?: string,
  minTotal = 3,
): Promise<ConceptStat[]> => {
  if (!hasAuth(userId)) return []
  let query = supabase
    .from('concept_stats')
    .select('tag, tag_type, topic_id, total_count, correct_count, last_seen_at')
    .eq('user_id', userId)
    .gte('total_count', minTotal)
    .order('last_seen_at', { ascending: false })
  if (topicId) query = query.eq('topic_id', topicId)

  const { data, error } = await query
  if (error) {
    const code = (error as { code?: string }).code ?? ''
    const msg = (error.message ?? '').toLowerCase()
    if (code === 'PGRST205' || msg.includes('concept_stats') || msg.includes('schema cache')) {
      // 테이블 미배포 — 조용히 빈 배열.
      return []
    }
    logError('getConceptStats', error)
    return []
  }
  if (!data) return []

  type Row = {
    tag: string
    tag_type: 'concept' | 'trap'
    topic_id: string | null
    total_count: number
    correct_count: number
    last_seen_at: string
  }
  return (data as unknown as Row[]).map((r) => ({
    tag: r.tag,
    tagType: r.tag_type,
    topicId: r.topic_id,
    total: r.total_count,
    correct: r.correct_count,
    accuracy: r.total_count > 0 ? r.correct_count / r.total_count : 0,
    lastSeenAt: r.last_seen_at,
  }))
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
  const hasCol = await hasElapsedSecondsColumn()
  const { data, error } = await supabase
    .from('quiz_logs')
    .select(hasCol ? 'topic_id, correct, elapsed_seconds' : 'topic_id, correct')
    .eq('user_id', userId)
  if (error || !data) return {}

  const acc: Record<string, { topicId: string; total: number; correct: number; secSum: number; secCount: number }> = {}
  for (const row of data as unknown as { topic_id: string; correct: boolean; elapsed_seconds: number | null }[]) {
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
  const hasCol = await hasElapsedSecondsColumn()
  const selectList = hasCol
    ? 'topic_id, correct, elapsed_seconds, created_at'
    : 'topic_id, correct, created_at'
  const [logsRes, countRes] = await Promise.all([
    supabase
      .from('quiz_logs')
      .select(selectList)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('quiz_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const logs = (logsRes.data ?? []) as unknown as {
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

// ── Concept extractions (Becker 분석 누적) ───────────────────
// Writes a metadata-only row to Supabase after /api/extract-concepts.
// Never contains the original question text. Fire-and-forget: if the
// migration hasn't been applied yet, we swallow the error so the UI flow
// is not blocked.
export interface ConceptExtractionRow {
  userId: string | null
  topicId: string | null
  concepts: string[]
  ascReferences: string[]
  topicTags: string[]
  trapPattern: string | null
  wasWrong: boolean | null
  /** SHA-256 of trimmed question text — exact-duplicate detection. */
  questionHash?: string | null
}

// ── 문제 원문 해시 ────────────────────────────────────────────
// Jaccard overlap은 개념 추출 결과 기준이라 서로 다른 분석 LLM 응답으로
// 같은 문제가 재추출되면 miss할 수 있다. question_hash는 문자 그대로 같은
// 문제를 두 번 분석하는 것을 값싸게 차단하기 위한 보조 수단.
export async function hashText(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 같은 user_id + question_hash row가 있는지 확인.
 * 존재하면 해당 row의 created_at ISO 문자열, 없으면 null.
 * 테이블/컬럼 미배포 상태 또는 조회 실패 시에도 null (차단하지 않음).
 */
export async function checkQuestionHash(
  userId: string,
  hash: string,
): Promise<string | null> {
  if (!hasAuth(userId) || !hash) return null
  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('question_hash', hash)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      const code = (error as { code?: string }).code ?? ''
      const msg = (error.message ?? '').toLowerCase()
      // 컬럼 미배포 — migration 007 아직 안 돌린 환경에서는 조용히 통과.
      if (
        code === 'PGRST204' ||
        code === '42703' ||
        msg.includes('question_hash') ||
        msg.includes('schema cache')
      ) {
        return null
      }
      logError('checkQuestionHash', error)
      return null
    }
    const row = data?.[0] as { created_at?: string } | undefined
    return row?.created_at ?? null
  } catch {
    return null
  }
}

// ── 중복 감지 ───────────────────────────────────────────────
// 저장 전 기존 데이터와 concepts 겹침 비율(Jaccard) 계산.
// 80%+ → full_dup, 50-80% → partial_dup, <50% → new
// full_dup / partial_dup 케이스는 매치된 상위 row 최대 2개를 함께 반환해
// UI에서 사용자가 직접 비교하고 "그래도 저장" 판단을 내릴 수 있게 한다.
export interface DupMatchedRow {
  concepts: string[]
  trapPattern: string | null
  topicId: string | null
  createdAt: string
  overlap: number
}

export type DupCheckResult =
  | { status: 'new' }
  | { status: 'full_dup'; matchedRows: DupMatchedRow[] }
  | { status: 'partial_dup'; newTrap: boolean; matchedRows: DupMatchedRow[] }

export async function checkConceptDuplication(
  topicId: string | null,
  newConcepts: string[],
  newTrapPattern: string | null,
): Promise<DupCheckResult> {
  if (!topicId || newConcepts.length === 0) return { status: 'new' }

  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('concepts, trap_pattern, topic_id, created_at')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data || data.length === 0) return { status: 'new' }

    const newSet = new Set(newConcepts.map((c) => c.toLowerCase()))

    // 각 기존 row의 Jaccard overlap을 수집 → 내림차순 정렬 → 상위 N개 유지.
    const scored: DupMatchedRow[] = []
    for (const row of data) {
      const existing: string[] = Array.isArray(row.concepts) ? row.concepts : []
      const existingSet = new Set(existing.map((c: string) => c.toLowerCase()))
      const union = new Set([...newSet, ...existingSet])
      let intersection = 0
      for (const k of newSet) {
        if (existingSet.has(k)) intersection++
      }
      const overlap = union.size > 0 ? intersection / union.size : 0
      scored.push({
        concepts: existing,
        trapPattern: typeof row.trap_pattern === 'string' ? row.trap_pattern : null,
        topicId: typeof row.topic_id === 'string' ? row.topic_id : null,
        createdAt: typeof row.created_at === 'string' ? row.created_at : '',
        overlap,
      })
    }
    scored.sort((a, b) => b.overlap - a.overlap)

    const topOverlap = scored[0]?.overlap ?? 0
    const matchedRows = scored.filter((r) => r.overlap >= 0.5).slice(0, 2)

    if (topOverlap >= 0.8) {
      return { status: 'full_dup', matchedRows }
    }

    if (topOverlap >= 0.5) {
      const bestMatchTrap = scored[0]?.trapPattern ?? null
      const hasNewTrap =
        !!newTrapPattern &&
        (!bestMatchTrap ||
          newTrapPattern.toLowerCase() !== bestMatchTrap.toLowerCase())
      return { status: 'partial_dup', newTrap: hasNewTrap, matchedRows }
    }

    return { status: 'new' }
  } catch {
    // 조회 실패 시 저장 허용
    return { status: 'new' }
  }
}

export async function saveConceptExtraction(
  row: ConceptExtractionRow,
): Promise<{ id: string } | null> {
  console.log('[db] saveConceptExtraction called', {
    hasUserId: !!row.userId,
    userIdPrefix: row.userId ? row.userId.slice(0, 8) : null,
    conceptsCount: row.concepts.length,
    ascCount: row.ascReferences.length,
    tagsCount: row.topicTags.length,
    hasTrap: !!row.trapPattern,
  })
  if (!hasAuth(row.userId)) {
    logSkip('saveConceptExtraction')
    return null
  }
  const basePayload: Record<string, unknown> = {
    user_id: row.userId,
    topic_id: row.topicId,
    concepts: row.concepts,
    asc_references: row.ascReferences,
    topic_tags: row.topicTags,
    trap_pattern: row.trapPattern,
    was_wrong: row.wasWrong,
  }
  const payload = row.questionHash
    ? { ...basePayload, question_hash: row.questionHash }
    : basePayload

  let { data, error } = await supabase
    .from('concept_extractions')
    .insert(payload)
    .select('id')
    .single()

  // Migration 007 미적용 환경에서는 question_hash 컬럼이 없어 PGRST204가
  // 난다. 이 경우 question_hash만 빼고 재시도 — 기존 저장 플로우는 유지.
  if (error && row.questionHash) {
    const code = (error as { code?: string }).code ?? ''
    const msg = (error.message ?? '').toLowerCase()
    if (
      code === 'PGRST204' ||
      code === '42703' ||
      msg.includes('question_hash') ||
      msg.includes('schema cache')
    ) {
      console.warn(
        '[db] concept_extractions.question_hash missing — ' +
          '007 migration not applied. Retrying without hash.',
      )
      const retry = await supabase
        .from('concept_extractions')
        .insert(basePayload)
        .select('id')
        .single()
      data = retry.data
      error = retry.error
    }
  }
  if (error) {
    // Dump the whole error object so code / details / hint / message all
    // show up in DevTools — makes "table missing" vs "RLS violation" vs
    // "column not in schema cache" distinguishable at a glance.
    console.error('[db] saveConceptExtraction FAILED', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      full: error,
    })
    if (error.code === '42P01' || /does not exist/i.test(error.message)) {
      console.error(
        '[db] → migration 004_concept_extractions.sql has not been applied. ' +
          'Run it in Supabase SQL editor before analysis saves will land.',
      )
    }
    if (error.code === '42501' || /row-level security/i.test(error.message)) {
      console.error(
        '[db] → RLS policy blocked insert. Check that auth.uid() matches user_id ' +
          'and that the `concept_extractions_own_insert` policy exists.',
      )
    }
    return null
  }
  console.log('[db] saveConceptExtraction OK', { id: data?.id })
  return data?.id ? { id: data.id as string } : null
}

// ── concept_extractions 삭제 ─────────────────────────────────
// 사용자가 방금 저장한 row를 되돌리고 싶을 때 호출. RLS의
// `concept_extractions_own_delete` 정책(migration 005)에 의존하므로
// 해당 마이그레이션이 적용돼 있어야 동작한다.
export async function deleteConceptExtraction(id: string): Promise<void> {
  const { error } = await supabase.from('concept_extractions').delete().eq('id', id)
  if (error) {
    console.error('[db] deleteConceptExtraction FAILED', {
      id,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    if (error.code === '42501' || /row-level security/i.test(error.message)) {
      console.error(
        '[db] → RLS policy blocked delete. Apply migration 005_concept_extractions_delete_policy.sql.',
      )
    }
    throw error
  }
}
