import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

// Triggered daily via GitHub Actions (KST 07:00 = UTC 22:00 previous day).
// For each active user: reads concept_stats + recent attempt_errors,
// generates a Korean FAR study briefing via Claude, upserts briefing_cache.
// On per-user failure: logs and continues — existing cache row is preserved.

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT =
  'You are a FAR exam study tutor for a Korean USCPA candidate. ' +
  'Generate a daily landing-page briefing in Korean only, in three parts:\n' +
  '1) "summary": 2~3 lines on current status (weak tags, recent error patterns). Plain text, no bullets.\n' +
  '2) "actions": exactly 3 short Korean action items (string array). Each item 1 line. ' +
  'Order: weakest concept focus -> calculation/rule to drill -> most frequent error pattern to watch.\n' +
  '3) "dayEstimate": 1 line about study pacing based on coverage and error frequency.\n' +
  'Return ONLY a compact JSON object with keys summary, actions, dayEstimate. ' +
  'No preamble, no markdown fences. Use "Book value(장부가액)" style for bilingual terms.'

interface WeakTag {
  tag: string
  tag_type: string
  topic_id: string | null
  accuracy: number
  total: number
}

interface TopError {
  pattern_id: string
  name: string
  count: number
}

interface BriefingResponse {
  summary: string
  actions: string[]
  dayEstimate: string
}

function parseBriefing(text: string): BriefingResponse {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { summary: text || '', actions: [], dayEstimate: '' }
  try {
    const parsed = JSON.parse(match[0]) as Partial<BriefingResponse>
    return {
      summary: parsed.summary ?? '',
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
      dayEstimate: parsed.dayEstimate ?? '',
    }
  } catch {
    return { summary: text, actions: [], dayEstimate: '' }
  }
}

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  // Active users: anyone with a concept_extraction in the last 30 days.
  const { data: activeRows, error: usersErr } = await supabase
    .from('concept_extractions')
    .select('user_id')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (usersErr) {
    console.error('failed to fetch active users:', usersErr)
    return new Response(JSON.stringify({ ok: false, error: usersErr.message }), { status: 500 })
  }

  const userIds = [...new Set((activeRows ?? []).map((r) => r.user_id as string))]

  if (userIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch error_patterns master list once for name lookup.
  const { data: patternMaster } = await supabase
    .from('error_patterns')
    .select('pattern_id, name')

  const patternName = new Map(
    (patternMaster ?? []).map((p: { pattern_id: string; name: string }) => [p.pattern_id, p.name])
  )

  let processed = 0
  let failed = 0

  for (const userId of userIds) {
    try {
      // Weak concept tags: accuracy < 0.6, at least 2 attempts, top 5 worst.
      const { data: statsRows } = await supabase
        .from('concept_stats')
        .select('tag, tag_type, topic_id, total_count, correct_count')
        .eq('user_id', userId)
        .gte('total_count', 2)

      const weakTags: WeakTag[] = (statsRows ?? [])
        .map((r: { tag: string; tag_type: string; topic_id: string | null; total_count: number; correct_count: number }) => ({
          tag: r.tag,
          tag_type: r.tag_type,
          topic_id: r.topic_id,
          accuracy: r.correct_count / r.total_count,
          total: r.total_count,
        }))
        .filter((r) => r.accuracy < 0.6)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5)

      // Recent error patterns: last 7 days, grouped by pattern_id.
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: errorRows } = await supabase
        .from('attempt_errors')
        .select('pattern_id')
        .eq('user_id', userId)
        .gte('created_at', since7d)

      const countByPattern: Record<string, number> = {}
      for (const row of errorRows ?? []) {
        countByPattern[row.pattern_id] = (countByPattern[row.pattern_id] ?? 0) + 1
      }
      const topErrors: TopError[] = Object.entries(countByPattern)
        .map(([pattern_id, count]) => ({
          pattern_id,
          name: patternName.get(pattern_id) ?? pattern_id,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      if (weakTags.length === 0 && topErrors.length === 0) {
        // Not enough data to generate a meaningful briefing; skip.
        continue
      }

      const userPayload = JSON.stringify({ weakTags, topErrors })

      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPayload }],
      })

      const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
      const briefing = parseBriefing(text)

      const contextSnapshot = { weak_tags: weakTags, top_errors: topErrors, generated_at: new Date().toISOString() }

      const { error: upsertErr } = await supabase
        .from('briefing_cache')
        .upsert(
          {
            user_id: userId,
            content: JSON.stringify(briefing),
            generated_at: new Date().toISOString(),
            context_snapshot: contextSnapshot,
          },
          { onConflict: 'user_id' }
        )

      if (upsertErr) {
        console.error(`upsert failed for ${userId}:`, upsertErr)
        failed++
      } else {
        processed++
      }
    } catch (err) {
      console.error(`briefing generation failed for ${userId}:`, err)
      failed++
      // Existing cache row is preserved — no upsert on failure.
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed, failed, total: userIds.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
