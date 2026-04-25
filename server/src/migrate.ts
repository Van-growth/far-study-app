import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// PostgreSQL error codes that mean "object already exists" — safe to skip
const ALREADY_EXISTS_CODES = new Set([
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42710', // duplicate_object
  '42P16', // invalid_table_definition (e.g. constraint already exists)
]);

export async function runMigrations(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('[migrate] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping migrations');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Ensure tracking table exists via exec_sql RPC
  const { error: createErr } = await supabase.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS migration_history (
      filename     text PRIMARY KEY,
      executed_at  timestamptz DEFAULT now()
    )`,
  });
  if (createErr) {
    console.error('[migrate] Failed to create migration_history:', createErr);
    throw createErr;
  }
  console.log('[migrate] connected');

  const dir = path.resolve(process.cwd(), '../supabase/migrations');
  if (!fs.existsSync(dir)) {
    console.log('[migrate] no supabase/migrations dir — skipping');
    return;
  }

  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { data, error: selectErr } = await supabase
    .from('migration_history')
    .select('filename');
  if (selectErr) {
    console.error('[migrate] Failed to read migration_history:', selectErr);
    throw selectErr;
  }

  const executed = new Set((data ?? []).map((r: { filename: string }) => r.filename));

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`[migrate] skip:  ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');

    const { error: sqlErr } = await supabase.rpc('exec_sql', { sql });

    if (sqlErr) {
      const pgCode = (sqlErr as { code?: string }).code ?? '';
      if (ALREADY_EXISTS_CODES.has(pgCode)) {
        console.warn(`[migrate] already applied (pg ${pgCode}): ${file}`);
      } else {
        console.error(`[migrate] FAILED: ${file}`, sqlErr);
        throw sqlErr;
      }
    } else {
      console.log(`[migrate] done:  ${file}`);
    }

    // Record as executed regardless of skip reason
    await supabase
      .from('migration_history')
      .upsert({ filename: file }, { onConflict: 'filename', ignoreDuplicates: true });
  }

  console.log('[migrate] all migrations complete');
}
