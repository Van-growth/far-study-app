const fs = require('fs')
const path = require('path')
const { createClient } = require('../client/node_modules/@supabase/supabase-js/dist/index.cjs')

// scripts/.env.script 로드 (dotenv 없이 최소 파서 — seed_topics.mjs와 동일 방식)
const envPath = path.resolve(__dirname, '.env.script')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY — scripts/.env.script를 확인하세요.')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Try exec_sql RPC
supabase.rpc('exec_sql', { sql: 'ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 10;' })
  .then(function(r) {
    if (r.error) {
      console.log('exec_sql failed:', r.error.message)
      // Fallback: check if column already exists
      return supabase.from('user_settings').select('daily_goal').limit(1).then(function(r2) {
        if (r2.error) {
          console.log('Column does not exist. Please apply migration 027 manually via Supabase dashboard SQL editor:')
          console.log('ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 10;')
        } else {
          console.log('Column daily_goal already exists.')
        }
      })
    } else {
      console.log('Migration 027 applied successfully via exec_sql RPC.')
    }
  })
  .catch(function(e) { console.error(e) })
