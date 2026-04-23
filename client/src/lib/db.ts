import { supabase } from './supabase'
import { localDateStr, parseLocalDate } from './date'

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

export const getTodayQuizStats = async (
  userId: string,
): Promise<{ count: number; correct: number }> => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('quiz_logs')
    .select('correct')
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
  const rows = (data ?? []) as { correct: boolean }[]
  return { count: rows.length, correct: rows.filter((r) => r.correct).length }
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
export interface ConceptTrigger {
  keyword: string
  auto_rule: string
  trap: string
  comparison: string
  irrelevant: string
}

export interface ConceptExtractionRow {
  userId: string | null
  topicId: string | null
  concepts: string[]
  ascReferences: string[]
  topicTags: string[]
  trapPattern: string | null
  wasWrong: boolean | null
  triggers?: ConceptTrigger[] | null
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

export interface StoredExtractionData {
  createdAt: string
  topicId: string | null
  concepts: string[]
  ascReferences: string[]
  topicTags: string[]
  trapPattern: string | null
}

export interface ExplanationStructured {
  core: string
  calculation: string | null
  traps: string[]
  memory: string
}

export interface ExampleQuestion {
  question: string
  options: string[]
  answer: string
  explanation: ExplanationStructured | string
}

export interface RecentExtractionItem {
  id: string
  createdAt: string
  topicId: string | null
  concepts: string[]
  ascReferences: string[]
  topicTags: string[]
  trapPattern: string | null
  triggers: ConceptTrigger[]
  nextReviewAt: string | null
  reviewInterval: number
  reviewCount: number
  exampleQuestion: ExampleQuestion | null
}

export async function fetchRecentExtractions(
  userId: string,
  limit = 10,
): Promise<RecentExtractionItem[]> {
  if (!hasAuth(userId)) return []

  const parseRows = (data: Record<string, unknown>[]): RecentExtractionItem[] =>
    data.map((row) => ({
      id: String(row.id ?? ''),
      createdAt: String(row.created_at ?? ''),
      topicId: typeof row.topic_id === 'string' ? row.topic_id : null,
      concepts: (Array.isArray(row.concepts) ? row.concepts : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      ascReferences: (Array.isArray(row.asc_references) ? row.asc_references : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      topicTags: (Array.isArray(row.topic_tags) ? row.topic_tags : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      trapPattern: typeof row.trap_pattern === 'string' ? row.trap_pattern : null,
      triggers: Array.isArray(row.triggers) ? (row.triggers as ConceptTrigger[]) : [],
      nextReviewAt: typeof row.next_review_at === 'string' ? row.next_review_at : null,
      reviewInterval: typeof row.review_interval === 'number' ? row.review_interval : 0,
      reviewCount: typeof row.review_count === 'number' ? row.review_count : 0,
      exampleQuestion: null,
    }))

  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('id, created_at, topic_id, concepts, asc_references, topic_tags, trap_pattern')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return parseRows(data as Record<string, unknown>[])
  } catch {
    return []
  }
}

export async function fetchExtractionsPage(
  userId: string,
  page: number,
  pageSize = 10,
): Promise<{ items: RecentExtractionItem[]; total: number | null }> {
  if (!hasAuth(userId)) return { items: [], total: null }
  const from = page * pageSize
  const to = from + pageSize - 1
  try {
    const { data, error, count } = await supabase
      .from('concept_extractions')
      .select('id, created_at, topic_id, concepts, asc_references, topic_tags, trap_pattern, next_review_at, review_interval, review_count', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error || !data) return { items: [], total: null }
    const items = (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id ?? ''),
      createdAt: String(row.created_at ?? ''),
      topicId: typeof row.topic_id === 'string' ? row.topic_id : null,
      concepts: (Array.isArray(row.concepts) ? row.concepts : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      ascReferences: (Array.isArray(row.asc_references) ? row.asc_references : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      topicTags: (Array.isArray(row.topic_tags) ? row.topic_tags : []).filter(
        (c): c is string => typeof c === 'string',
      ),
      trapPattern: typeof row.trap_pattern === 'string' ? row.trap_pattern : null,
      triggers: [],
      nextReviewAt: typeof row.next_review_at === 'string' ? row.next_review_at : null,
      reviewInterval: typeof row.review_interval === 'number' ? row.review_interval : 0,
      reviewCount: typeof row.review_count === 'number' ? row.review_count : 0,
      exampleQuestion: null,
    }))
    return { items, total: count ?? null }
  } catch {
    return { items: [], total: null }
  }
}

/**
 * question_hash로 저장된 concept_extractions row 전체를 가져온다.
 * 미배포/조회 실패 시 null (차단하지 않음).
 */
export async function fetchExtractionByHash(
  userId: string,
  hash: string,
): Promise<StoredExtractionData | null> {
  if (!hasAuth(userId) || !hash) return null
  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('created_at, topic_id, concepts, asc_references, topic_tags, trap_pattern')
      .eq('user_id', userId)
      .eq('question_hash', hash)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error || !data || data.length === 0) return null
    const row = data[0] as {
      created_at: string
      topic_id: string | null
      concepts: unknown[]
      asc_references: unknown[]
      topic_tags: unknown[]
      trap_pattern: unknown
    }
    return {
      createdAt: row.created_at,
      topicId: row.topic_id,
      concepts: (row.concepts ?? []).filter((c): c is string => typeof c === 'string'),
      ascReferences: (row.asc_references ?? []).filter((c): c is string => typeof c === 'string'),
      topicTags: (row.topic_tags ?? []).filter((c): c is string => typeof c === 'string'),
      trapPattern: typeof row.trap_pattern === 'string' ? row.trap_pattern : null,
    }
  } catch {
    return null
  }
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
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const basePayload: Record<string, unknown> = {
    user_id: row.userId,
    topic_id: row.topicId,
    concepts: row.concepts,
    asc_references: row.ascReferences,
    topic_tags: row.topicTags,
    trap_pattern: row.trapPattern,
    was_wrong: row.wasWrong,
    triggers: row.triggers ?? [],
    next_review_at: tomorrow.toISOString(),
  }
  const payload = row.questionHash
    ? { ...basePayload, question_hash: row.questionHash }
    : basePayload

  let { data, error } = await supabase
    .from('concept_extractions')
    .insert(payload)
    .select('id')
    .single()

  // Migration 007 (question_hash) or 015 (triggers) not applied yet — retry without optional columns.
  if (error) {
    const code = (error as { code?: string }).code ?? ''
    if (code === 'PGRST204' || code === '42703' || code === '400' || (error as { status?: number }).status === 400) {
      console.warn('[db] saveConceptExtraction schema error — retrying without optional columns', { code })
      const { triggers: _t, ...withoutTriggers } = basePayload as Record<string, unknown> & { triggers?: unknown }
      const corePayload = withoutTriggers
      const retry = await supabase
        .from('concept_extractions')
        .insert(corePayload)
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

// ── Error Pattern Library (migration 008) ───────────────────
// 마스터 패턴 14개, 개인 태깅(attempt_errors), 개인 집계(pattern_stats),
// 전체 집계 뷰(global_pattern_stats). 아래 헬퍼들은 migration 008 이
// 적용되기 전 환경에서도 조용히 degrade 한다 — 기능 없어도 퀴즈/대시보드
// 흐름은 안 막힌다.
export type ErrorPatternLayer = 'root' | 'exec' | 'outcome'

export interface ErrorPattern {
  patternId: string
  layer: ErrorPatternLayer
  name: string
  description: string | null
  linkedTopics: string[]
}

export interface MyPatternStat {
  patternId: string
  occurrence: number
  recentRate: number
  improvement: number
  lastSeen: string | null
}

export interface GlobalPatternStat {
  patternId: string
  userCount: number
  totalOccurrence: number
  recentShare: number
}

let errorPatternsCache: ErrorPattern[] | null = null
let errorPatternsSupported: boolean | null = null

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = error.code ?? ''
  const msg = (error.message ?? '').toLowerCase()
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  )
}

export async function getErrorPatterns(): Promise<ErrorPattern[]> {
  if (errorPatternsCache) return errorPatternsCache
  if (errorPatternsSupported === false) return []
  const { data, error } = await supabase
    .from('error_patterns')
    .select('pattern_id, layer, name, description, linked_topics')
    .order('pattern_id', { ascending: true })
  if (error) {
    if (isMissingRelation(error)) {
      errorPatternsSupported = false
      console.warn(
        '[db] error_patterns table missing — run supabase/migrations/008_error_patterns.sql.',
      )
      return []
    }
    logError('getErrorPatterns', error)
    return []
  }
  const rows = (data ?? []) as unknown as {
    pattern_id: string
    layer: ErrorPatternLayer
    name: string
    description: string | null
    linked_topics: string[] | null
  }[]
  errorPatternsCache = rows.map((r) => ({
    patternId: r.pattern_id,
    layer: r.layer,
    name: r.name,
    description: r.description,
    linkedTopics: r.linked_topics ?? [],
  }))
  errorPatternsSupported = true
  return errorPatternsCache
}

/**
 * tag_attempt_error RPC. 성공 시 attempt_errors.id 반환, 실패 시 null.
 * quiz_log_id 는 null 허용 — 저장 파이프라인이 fire-and-forget 이라
 * 정확한 id 를 잡기 어려운 케이스에서도 본인 에러 집계는 유지된다.
 */
export async function tagAttemptError(
  args: {
    quizLogId: string | null
    patternId: string
    topic: string | null
    userNote: string | null
    aiDiagnosis: string | null
  },
): Promise<string | null> {
  const { data, error } = await supabase.rpc('tag_attempt_error', {
    p_quiz_log_id: args.quizLogId,
    p_pattern_id: args.patternId,
    p_topic: args.topic,
    p_user_note: args.userNote,
    p_ai_diagnosis: args.aiDiagnosis,
  })
  if (error) {
    if (isMissingRelation(error)) {
      console.warn('[db] tag_attempt_error RPC missing — migration 008 not applied.')
      return null
    }
    logError('tagAttemptError', error)
    return null
  }
  return (data as string | null) ?? null
}

export async function refreshPatternStats(): Promise<void> {
  const { error } = await supabase.rpc('refresh_pattern_stats')
  if (error && !isMissingRelation(error)) {
    logError('refreshPatternStats', error)
  }
}

export async function getMyPatternStats(userId: string): Promise<MyPatternStat[]> {
  if (!hasAuth(userId)) return []
  const { data, error } = await supabase
    .from('pattern_stats')
    .select('pattern_id, occurrence, recent_rate, improvement, last_seen')
    .eq('user_id', userId)
    .order('occurrence', { ascending: false })
  if (error) {
    if (isMissingRelation(error)) return []
    logError('getMyPatternStats', error)
    return []
  }
  return ((data ?? []) as unknown as {
    pattern_id: string
    occurrence: number
    recent_rate: number
    improvement: number
    last_seen: string | null
  }[]).map((r) => ({
    patternId: r.pattern_id,
    occurrence: r.occurrence,
    recentRate: r.recent_rate,
    improvement: r.improvement,
    lastSeen: r.last_seen,
  }))
}

export async function getGlobalPatternStats(): Promise<GlobalPatternStat[]> {
  const { data, error } = await supabase
    .from('global_pattern_stats')
    .select('pattern_id, user_count, total_occurrence, recent_share')
  if (error) {
    if (isMissingRelation(error)) return []
    logError('getGlobalPatternStats', error)
    return []
  }
  return ((data ?? []) as unknown as {
    pattern_id: string
    user_count: number
    total_occurrence: number
    recent_share: number | null
  }[]).map((r) => ({
    patternId: r.pattern_id,
    userCount: r.user_count,
    totalOccurrence: r.total_occurrence,
    recentShare: r.recent_share ?? 0,
  }))
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

// ── Home tutor briefing aggregations ─────────────────────────
// These helpers feed the HomePage (`/`) briefing. They stay cheap
// (one query each, no joins) and degrade silently on missing tables.

function mondayOfThisWeek(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  // getDay(): 0=Sun, 1=Mon … convert so Monday=0, Sunday=6.
  const offset = (now.getDay() + 6) % 7
  now.setDate(now.getDate() - offset)
  return now
}

function mondayOfLastWeek(): Date {
  const m = mondayOfThisWeek()
  m.setDate(m.getDate() - 7)
  return m
}

/** Count of concept_extractions rows created since this week's Monday. */
export async function getWeekAnalyzeCount(userId: string): Promise<number> {
  if (!hasAuth(userId)) return 0
  const sinceIso = mondayOfThisWeek().toISOString()
  const { count, error } = await supabase
    .from('concept_extractions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
  if (error) {
    if (isMissingRelation(error)) return 0
    logError('getWeekAnalyzeCount', error)
    return 0
  }
  return count ?? 0
}

/** Distinct topic_ids that have at least one concept_extractions row. */
export async function getAnalyzedModuleIds(userId: string): Promise<string[]> {
  if (!hasAuth(userId)) return []
  const { data, error } = await supabase
    .from('concept_extractions')
    .select('topic_id')
    .eq('user_id', userId)
    .not('topic_id', 'is', null)
  if (error) {
    if (isMissingRelation(error)) return []
    logError('getAnalyzedModuleIds', error)
    return []
  }
  const seen = new Set<string>()
  for (const row of (data ?? []) as { topic_id: string | null }[]) {
    if (row.topic_id) seen.add(row.topic_id)
  }
  return [...seen]
}

/** Per-module quiz_logs accuracy for this-week vs last-week. Used to
 *  surface the "improving module" (largest positive delta) and
 *  "weakest module" (lowest this-week accuracy). */
export interface ModuleWeekAccuracy {
  topicId: string
  thisWeekTotal: number
  thisWeekCorrect: number
  thisWeekAccuracy: number | null
  lastWeekTotal: number
  lastWeekCorrect: number
  lastWeekAccuracy: number | null
  delta: number | null // thisWeek - lastWeek; null if either side empty
}

export async function getModuleWeekAccuracy(
  userId: string,
): Promise<ModuleWeekAccuracy[]> {
  if (!hasAuth(userId)) return []
  const sinceIso = mondayOfLastWeek().toISOString()
  const { data, error } = await supabase
    .from('quiz_logs')
    .select('topic_id, correct, created_at')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
  if (error) {
    logError('getModuleWeekAccuracy', error)
    return []
  }
  const thisMonday = mondayOfThisWeek().getTime()
  const acc = new Map<
    string,
    { tT: number; tC: number; lT: number; lC: number }
  >()
  for (const row of (data ?? []) as {
    topic_id: string
    correct: boolean
    created_at: string
  }[]) {
    const id = row.topic_id
    if (!id) continue
    const t = new Date(row.created_at).getTime()
    const isThisWeek = t >= thisMonday
    const cur = acc.get(id) ?? { tT: 0, tC: 0, lT: 0, lC: 0 }
    if (isThisWeek) {
      cur.tT++
      if (row.correct) cur.tC++
    } else {
      cur.lT++
      if (row.correct) cur.lC++
    }
    acc.set(id, cur)
  }
  const out: ModuleWeekAccuracy[] = []
  for (const [topicId, v] of acc.entries()) {
    const thisAcc = v.tT > 0 ? v.tC / v.tT : null
    const lastAcc = v.lT > 0 ? v.lC / v.lT : null
    const delta =
      thisAcc !== null && lastAcc !== null ? thisAcc - lastAcc : null
    out.push({
      topicId,
      thisWeekTotal: v.tT,
      thisWeekCorrect: v.tC,
      thisWeekAccuracy: thisAcc,
      lastWeekTotal: v.lT,
      lastWeekCorrect: v.lC,
      lastWeekAccuracy: lastAcc,
      delta,
    })
  }
  return out
}

/** Lowest-accuracy concept_stats tag with at least 3 attempts. Used
 *  to suggest the weakest concept/calculation in the briefing. */
export async function getWeakestConceptTag(
  userId: string,
): Promise<ConceptStat | null> {
  const rows = await getConceptStats(userId, undefined, 3)
  if (rows.length === 0) return null
  return rows.slice().sort((a, b) => a.accuracy - b.accuracy)[0]
}

// ── 통합 학습 활동 집계 ───────────────────────────────────────
// concept_extractions(분석) + reviewed_at(복습) 기준으로 집계.
// 퀴즈 기능이 제거됐으므로 quiz_logs 참조 없음.

export interface StudyActivityStats {
  totalDays: number   // 분석 또는 복습 있는 unique 날짜 수 (최근 1년)
  weekCount: number   // 이번 주 분석 수 + 복습 수
  analyzeTotal: number // 전체 누적 분석(concept_extractions) 건수
  streak: number      // 연속 학습일 (분석 또는 복습 기준)
  /** @deprecated use analyzeTotal */
  quizTotal: number
  /** @deprecated always 0 */
  quizCorrect: number
}

export async function getStudyActivityStats(userId: string): Promise<StudyActivityStats> {
  const empty: StudyActivityStats = { totalDays: 0, weekCount: 0, analyzeTotal: 0, quizTotal: 0, quizCorrect: 0, streak: 0 }
  if (!hasAuth(userId)) return empty

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const sinceIso = oneYearAgo.toISOString()
  const weekStart = mondayOfThisWeek().toISOString()

  const safeQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      const r = await fn()
      return r
    } catch { return fallback }
  }

  const [analyzeDates, reviewDates, analyzeWeek, reviewWeek, analyzeAll] =
    await Promise.all([
      // 분석 날짜 (created_at)
      safeQuery(async () => {
        const r = await supabase.from('concept_extractions').select('created_at').eq('user_id', userId).gte('created_at', sinceIso)
        if (r.error && isMissingRelation(r.error)) return { data: [] }
        return r
      }, { data: [] }),
      // 복습 날짜 (reviewed_at, migration 014 이상)
      safeQuery(async () => {
        const r = await supabase.from('concept_extractions').select('reviewed_at').eq('user_id', userId).gte('reviewed_at', sinceIso).not('reviewed_at', 'is', null)
        if (r.error) return { data: [] }
        return r
      }, { data: [] }),
      // 이번 주 분석 수
      safeQuery(async () => {
        const r = await supabase.from('concept_extractions').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStart)
        if (r.error && isMissingRelation(r.error)) return { count: 0 }
        return r
      }, { count: 0 }),
      // 이번 주 복습 수
      safeQuery(async () => {
        const r = await supabase.from('concept_extractions').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('reviewed_at', weekStart).not('reviewed_at', 'is', null)
        if (r.error) return { count: 0 }
        return r
      }, { count: 0 }),
      // 전체 분석 건수
      safeQuery(async () => {
        const r = await supabase.from('concept_extractions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        if (r.error && isMissingRelation(r.error)) return { count: 0 }
        return r
      }, { count: 0 }),
    ])

  // Unique local-date set (분석 OR 복습)
  const daySet = new Set<string>()
  for (const r of (analyzeDates.data ?? []) as { created_at: string }[]) {
    if (r.created_at) daySet.add(localDateStr(new Date(r.created_at)))
  }
  for (const r of (reviewDates.data ?? []) as { reviewed_at: string }[]) {
    if (r.reviewed_at) daySet.add(localDateStr(new Date(r.reviewed_at)))
  }

  // Streak — walk backward from today through the union of dates
  const sortedDates = [...daySet].sort().reverse()
  let streak = 0
  let cursor = localDateStr(new Date())
  for (const d of sortedDates) {
    if (d === cursor) {
      streak++
      const prev = parseLocalDate(cursor)
      prev.setDate(prev.getDate() - 1)
      cursor = localDateStr(prev)
    } else if (d < cursor) {
      break
    }
  }

  const analyzeTotal = (analyzeAll as { count?: number | null }).count ?? 0
  return {
    totalDays: daySet.size,
    weekCount: ((analyzeWeek as { count?: number | null }).count ?? 0) + ((reviewWeek as { count?: number | null }).count ?? 0),
    analyzeTotal,
    quizTotal: analyzeTotal,
    quizCorrect: 0,
    streak,
  }
}

/** 오늘 concept_extractions 건수 (로컬 자정 기준) */
export async function getTodayAnalyzeCount(userId: string): Promise<number> {
  if (!hasAuth(userId)) return 0
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('concept_extractions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())
    if (error) { if (isMissingRelation(error)) return 0; return 0 }
    return count ?? 0
  } catch { return 0 }
}

/** concept_extractions 분석 건수를 topicId 별로 반환 */
export async function getAnalyzeCountByTopic(userId: string): Promise<Record<string, number>> {
  if (!hasAuth(userId)) return {}
  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('topic_id')
      .eq('user_id', userId)
      .not('topic_id', 'is', null)
    if (error) {
      if (isMissingRelation(error)) return {}
      logError('getAnalyzeCountByTopic', error)
      return {}
    }
    const acc: Record<string, number> = {}
    for (const row of (data ?? []) as { topic_id: string | null }[]) {
      if (row.topic_id) acc[row.topic_id] = (acc[row.topic_id] ?? 0) + 1
    }
    return acc
  } catch { return {} }
}

/** study_sessions (quiz) + concept_extractions (analysis) 날짜를 합산한 캘린더 데이터 */
export async function getCalendarWithAnalysis(userId: string): Promise<{
  date: string
  quiz_count: number
  correct_count: number
  analyze_count: number
}[]> {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const [calRows, analyzeRows] = await Promise.all([
    getCalendar(userId),
    (async () => {
      if (!hasAuth(userId)) return []
      try {
        const { data, error } = await supabase
          .from('concept_extractions')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', oneYearAgo.toISOString())
        if (error) return []
        return (data ?? []) as { created_at: string }[]
      } catch { return [] }
    })(),
  ])

  // Count analysis per local date
  const analyzeByDate = new Map<string, number>()
  for (const r of analyzeRows) {
    if (r.created_at) {
      const d = localDateStr(new Date(r.created_at))
      analyzeByDate.set(d, (analyzeByDate.get(d) ?? 0) + 1)
    }
  }

  // Merge quiz calendar rows + analysis-only dates
  const merged = new Map<string, { quiz_count: number; correct_count: number; analyze_count: number }>()
  for (const row of calRows as { date: string; quiz_count: number; correct_count: number }[]) {
    merged.set(row.date, {
      quiz_count: row.quiz_count,
      correct_count: row.correct_count,
      analyze_count: analyzeByDate.get(row.date) ?? 0,
    })
  }
  for (const [date, count] of analyzeByDate.entries()) {
    if (!merged.has(date)) {
      merged.set(date, { quiz_count: 0, correct_count: 0, analyze_count: count })
    }
  }

  return [...merged.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── concept_extractions SRS (migration 011) ───────────────────
const REVIEW_INTERVALS = [1, 3, 7, 14, 30] // days

/**
 * On-demand: find un-reviewed concepts (review_count = 0, not yet due)
 * and set next_review_at = now so they appear as due immediately.
 * Returns the number of cards made available.
 */
export async function generateOnDemandReviewCards(
  userId: string,
  limit = 10,
): Promise<number> {
  if (!hasAuth(userId)) return 0
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('id')
      .eq('user_id', userId)
      .eq('review_count', 0)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) return 0

    const ids = (data as { id: string }[]).map((r) => r.id)

    const { error: updateErr } = await supabase
      .from('concept_extractions')
      .update({ next_review_at: now })
      .in('id', ids)

    if (updateErr) {
      logError('generateOnDemandReviewCards', updateErr)
      return 0
    }
    return ids.length
  } catch {
    return 0
  }
}

export async function fetchDueExtractions(userId: string): Promise<RecentExtractionItem[]> {
  if (!hasAuth(userId)) return []
  try {
    const now = new Date().toISOString()
    // Columns added by later migrations — fetched opportunistically, absent = []
    const coreSelect = 'id, created_at, topic_id, concepts, asc_references, topic_tags, trap_pattern, next_review_at, review_interval, review_count'

    const runQuery = (select: string) =>
      supabase
        .from('concept_extractions')
        .select(select)
        .eq('user_id', userId)
        .not('next_review_at', 'is', null)
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true })

    // Try full select (triggers + example_question), fall back to core on any schema error
    let result = await runQuery(`${coreSelect}, triggers, example_question`)
    let hasTriggers = true
    let hasEq = true
    if (result.error) {
      // Retry with just core columns — handles triggers or example_question missing
      result = await runQuery(coreSelect)
      hasTriggers = false
      hasEq = false
    }
    if (result.error || !result.data) return []
    return (result.data as unknown as Record<string, unknown>[]).map((row) => ({
      id: String(row.id ?? ''),
      createdAt: String(row.created_at ?? ''),
      topicId: typeof row.topic_id === 'string' ? row.topic_id : null,
      concepts: (Array.isArray(row.concepts) ? row.concepts : []).filter((c): c is string => typeof c === 'string'),
      ascReferences: (Array.isArray(row.asc_references) ? row.asc_references : []).filter((c): c is string => typeof c === 'string'),
      topicTags: (Array.isArray(row.topic_tags) ? row.topic_tags : []).filter((c): c is string => typeof c === 'string'),
      trapPattern: typeof row.trap_pattern === 'string' ? row.trap_pattern : null,
      triggers: hasTriggers && Array.isArray(row.triggers) ? (row.triggers as ConceptTrigger[]) : [],
      nextReviewAt: typeof row.next_review_at === 'string' ? row.next_review_at : null,
      reviewInterval: typeof row.review_interval === 'number' ? row.review_interval : 0,
      reviewCount: typeof row.review_count === 'number' ? row.review_count : 0,
      exampleQuestion: (() => {
        if (!hasEq || !row.example_question || typeof row.example_question !== 'object' || Array.isArray(row.example_question)) return null;
        const eq = row.example_question as Record<string, unknown>;
        if (!eq.question || !Array.isArray(eq.options) || eq.options.length === 0) return null;
        return {
          question: String(eq.question),
          options: (eq.options as unknown[]).map((o) => (typeof o === 'string' ? o : String(o))),
          answer: eq.answer != null ? String(eq.answer) : '',
          explanation: eq.explanation ?? '',
        } as ExampleQuestion;
      })(),
    }))
  } catch { return [] }
}

export async function getConceptDueCount(userId: string): Promise<number> {
  if (!hasAuth(userId)) return 0
  try {
    const now = new Date().toISOString()
    const { count, error } = await supabase
      .from('concept_extractions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('next_review_at', 'is', null)
      .lte('next_review_at', now)
    if (error) {
      const code = (error as { code?: string }).code ?? ''
      const msg = (error.message ?? '').toLowerCase()
      if (code === 'PGRST204' || code === '42703' || msg.includes('next_review_at')) return 0
      return 0
    }
    return count ?? 0
  } catch { return 0 }
}

export async function updateConceptReview(id: string, knew: boolean): Promise<void> {
  try {
    const { data } = await supabase
      .from('concept_extractions')
      .select('review_interval, review_count')
      .eq('id', id)
      .single()

    const row = data as { review_interval: number; review_count: number } | null
    const currentInterval = row?.review_interval ?? 0
    const currentCount = row?.review_count ?? 0

    let nextDays: number
    if (!knew) {
      nextDays = 1
    } else if (currentInterval === 0) {
      nextDays = REVIEW_INTERVALS[0]
    } else {
      const idx = REVIEW_INTERVALS.indexOf(currentInterval)
      nextDays = idx === -1
        ? REVIEW_INTERVALS[0]
        : REVIEW_INTERVALS[Math.min(idx + 1, REVIEW_INTERVALS.length - 1)]
    }

    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + nextDays)
    nextDate.setHours(0, 0, 0, 0)

    const updatePayload: Record<string, unknown> = {
      next_review_at: nextDate.toISOString(),
      review_interval: nextDays,
      review_count: currentCount + 1,
      reviewed_at: new Date().toISOString(),
      review_result: knew ? 'known' : 'confused',
    }

    await supabase.from('concept_extractions').update(updatePayload).eq('id', id)
  } catch (e) {
    console.warn('[db] updateConceptReview failed:', e)
  }
}

/** Count today's known/confused reviews from concept_extractions.reviewed_at. */
export async function getTodayReviewStats(
  userId: string,
): Promise<{ knewCount: number; confusedCount: number }> {
  if (!hasAuth(userId)) return { knewCount: 0, confusedCount: 0 }
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('review_result')
      .eq('user_id', userId)
      .gte('reviewed_at', todayStart.toISOString())
      .not('review_result', 'is', null)

    if (error) {
      const code = (error as { code?: string }).code ?? ''
      const msg = (error.message ?? '').toLowerCase()
      if (code === 'PGRST204' || code === '42703' || msg.includes('reviewed_at') || msg.includes('review_result')) {
        // migration 014 not applied yet
        return { knewCount: 0, confusedCount: 0 }
      }
      return { knewCount: 0, confusedCount: 0 }
    }

    const rows = (data ?? []) as { review_result: string }[]
    return {
      knewCount: rows.filter((r) => r.review_result === 'known').length,
      confusedCount: rows.filter((r) => r.review_result === 'confused').length,
    }
  } catch {
    return { knewCount: 0, confusedCount: 0 }
  }
}

// ── Daily review log (migration 012) ─────────────────────────

/** @deprecated daily_review_log table removed — tracking moved to concept_extractions.reviewed_at */
export async function upsertDailyReviewLog(
  _userId: string,
  _delta: { knew: number; confused: number }
): Promise<void> {
  // no-op: daily_review_log table does not exist; review counts are derived from concept_extractions
}

/** @deprecated use getTodayReviewStats instead */
export async function getTodayReviewLog(
  _userId: string
): Promise<{ knewCount: number; confusedCount: number }> {
  return { knewCount: 0, confusedCount: 0 }
}

// ── Briefing cache ────────────────────────────────────────────

export interface BriefingResponse {
  summary: string
  actions: string[]
  dayEstimate: string
}

/**
 * Returns today's server-generated briefing from briefing_cache, or null
 * if the cached row is missing or stale (not from today KST).
 * The client falls back to calling /api/tutor/briefing directly when null.
 */
export async function getBriefingCache(userId: string): Promise<BriefingResponse | null> {
  if (!hasAuth(userId)) return null
  try {
    const { data, error } = await supabase
      .from('briefing_cache')
      .select('content, generated_at')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    const todayKST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    const generatedKST = new Date(data.generated_at as string).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Seoul',
    })
    if (generatedKST !== todayKST) return null

    return JSON.parse(data.content as string) as BriefingResponse
  } catch {
    return null
  }
}
