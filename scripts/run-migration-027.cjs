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

// Test read to confirm column now works (supabase-js can't run DDL directly)
// Migration must be applied via Supabase dashboard or CLI
// This script verifies the column exists after applying migration
supabase.from('user_settings').select('daily_goal').limit(1)
  .then(function(r) {
    if (r.error) {
      var code = (r.error.code || '')
      var msg = (r.error.message || '').toLowerCase()
      if (code === 'PGRST204' || code === '42703' || msg.includes('daily_goal')) {
        console.log('Column daily_goal does not exist yet — applying via REST...')
        // Use management API to run DDL
        return fetch('https://api.supabase.com/v1/projects/rtvxplocohllzwdlzjaz/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sbp_placeholder' },
          body: JSON.stringify({ query: 'ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 10;' })
        }).then(function(res) {
          console.log('Management API status:', res.status)
        })
      }
      console.error('Unexpected error:', r.error)
    } else {
      console.log('Column daily_goal already exists or migration applied successfully.')
    }
  })
  .catch(function(e) { console.error(e) })
