const { createClient } = require('../client/node_modules/@supabase/supabase-js/dist/index.cjs')

const supabase = createClient(
  'https://rtvxplocohllzwdlzjaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnhwbG9jb2hsbHp3ZGx6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNzYxMCwiZXhwIjoyMDkxNDgzNjEwfQ.1uRPpyooaxZhXQXrDoFPGmndbpPYR0c_HKdaAfQkeaQ'
)

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
