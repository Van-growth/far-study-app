import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  console.error(
    '[Supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    `  VITE_SUPABASE_URL = ${url ? '✅ set' : '❌ missing'}\n` +
    `  VITE_SUPABASE_ANON_KEY = ${key ? '✅ set' : '❌ missing'}`,
  )
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-key',
)
