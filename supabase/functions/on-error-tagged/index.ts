import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Triggered by: attempt_errors INSERT (Supabase Dashboard webhook)
// Calls refresh_pattern_stats_for_user so that recent_rate and improvement
// are recalculated server-side after every error tag.
// occurrence++ is already handled by the tag_attempt_error RPC on the client side.

Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const record = payload.record as {
    user_id: string
    pattern_id: string
  }

  const { user_id } = record

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

  const { error } = await supabase.rpc('refresh_pattern_stats_for_user', {
    p_user_id: user_id,
  })

  if (error) {
    console.error('refresh_pattern_stats_for_user error:', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
