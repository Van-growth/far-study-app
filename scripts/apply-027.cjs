const { createClient } = require('../client/node_modules/@supabase/supabase-js/dist/index.cjs')

const supabase = createClient(
  'https://rtvxplocohllzwdlzjaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnhwbG9jb2hsbHp3ZGx6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNzYxMCwiZXhwIjoyMDkxNDgzNjEwfQ.1uRPpyooaxZhXQXrDoFPGmndbpPYR0c_HKdaAfQkeaQ'
)

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
