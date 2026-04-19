import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Triggered by: concept_extractions INSERT (Supabase Dashboard webhook)
// Upserts concept_stats for each concept tag and trap_pattern in the new row.
// Uses concept_stats_increment_for_user RPC (service-role variant) because
// concept_stats_increment uses auth.uid() which is null in service-role context.

Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const record = payload.record as {
    user_id: string
    topic_id: string | null
    concepts: string[]
    trap_pattern: string | null
    was_wrong: boolean | null
  }

  const { user_id, topic_id, concepts, trap_pattern, was_wrong } = record

  if (!user_id) {
    return new Response(JSON.stringify({ ok: false, error: 'missing user_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const isCorrect = was_wrong === false

  const tags: { tag: string; tag_type: 'concept' | 'trap' }[] = [
    ...(Array.isArray(concepts) ? concepts : []).map((tag) => ({
      tag,
      tag_type: 'concept' as const,
    })),
    ...(trap_pattern ? [{ tag: trap_pattern, tag_type: 'trap' as const }] : []),
  ]

  if (tags.length === 0) {
    return new Response(JSON.stringify({ ok: true, upserted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = await Promise.allSettled(
    tags.map(({ tag, tag_type }) =>
      supabase.rpc('concept_stats_increment_for_user', {
        p_user_id: user_id,
        p_tag: tag,
        p_tag_type: tag_type,
        p_topic_id: topic_id ?? null,
        p_is_correct: isCorrect,
      })
    )
  )

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason)

  if (errors.length > 0) {
    console.error('concept_stats upsert errors:', errors)
  }

  return new Response(
    JSON.stringify({ ok: true, upserted: tags.length - errors.length, errors: errors.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
