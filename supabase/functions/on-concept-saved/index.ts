import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Triggered by: concept_extractions INSERT (Supabase Dashboard webhook)
// 1. Upserts concept_stats for each concept tag and trap_pattern in the new row.
// 2. Calls Claude Haiku to generate an example question and saves it back to the row.

interface ExplanationStructured {
  core: string
  calculation: string | null
  traps: string[]
  memory: string
}

interface ExampleQuestion {
  question: string
  options: string[]
  answer: string
  explanation: ExplanationStructured
}

async function generateExampleQuestion(
  concepts: string[],
  trapPattern: string | null,
  anthropicKey: string,
): Promise<ExampleQuestion | null> {
  const conceptList = concepts.slice(0, 6).join(', ')
  const trapLine = trapPattern ? `\nTrap pattern to include as a wrong option: ${trapPattern}` : ''

  const prompt = `Generate one FAR MCQ-style practice question in English.

Concepts to test: ${conceptList}${trapLine}

Rules:
- Question and 4 options must be in English
- Keep it concept-based, solvable in ≤3 seconds if you know the concept
- Include exactly one trap option
- traps array: one entry per wrong option (e.g. "A: why wrong"), skip correct option
- calculation: multi-line string if numeric steps needed, otherwise null
- memory: one Korean sentence summarizing the key takeaway

Output ONLY valid JSON, no markdown fences:
{"question":"...(English)...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"C","explanation":{"core":"one-line key reason (English)","calculation":"step-by-step or null","traps":["A: ...","B: ...","D: ..."],"memory":"한 줄 핵심 포인트 (Korean)"}}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json() as { content?: { type: string; text: string }[] }
    const text = data.content?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned) as ExampleQuestion
    const exp = parsed.explanation

    if (
      typeof parsed.question === 'string' &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 4 &&
      typeof parsed.answer === 'string' &&
      typeof exp === 'object' && exp !== null &&
      typeof exp.core === 'string' &&
      Array.isArray(exp.traps) &&
      typeof exp.memory === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const record = payload.record as {
    id: string
    user_id: string
    topic_id: string | null
    concepts: string[]
    trap_pattern: string | null
    was_wrong: boolean | null
  }

  const { id, user_id, topic_id, concepts, trap_pattern, was_wrong } = record

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

  // 1. Upsert concept_stats (existing logic)
  let upserted = 0
  let statErrors = 0

  if (tags.length > 0) {
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
    upserted = tags.length - errors.length
    statErrors = errors.length
  }

  // 2. Generate example question via Claude Haiku
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (anthropicKey && id && Array.isArray(concepts) && concepts.length > 0) {
    const eq = await generateExampleQuestion(concepts, trap_pattern ?? null, anthropicKey)
    if (eq) {
      const { error: updateErr } = await supabase
        .from('concept_extractions')
        .update({ example_question: eq })
        .eq('id', id)

      if (updateErr) {
        console.error('example_question update error:', updateErr)
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, upserted, errors: statErrors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
