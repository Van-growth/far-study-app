import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// PostgreSQL error codes that mean "object already exists" — safe to skip
const ALREADY_EXISTS_CODES = new Set([
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42710', // duplicate_object
  '42P16', // invalid_table_definition (e.g. constraint already exists)
]);

export async function runMigrations(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[migrate] DATABASE_URL not set — skipping migrations');
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[migrate] connected');

    // Ensure tracking table exists (always safe — IF NOT EXISTS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        filename     text PRIMARY KEY,
        executed_at  timestamptz DEFAULT now()
      )
    `);

    const dir = path.resolve(process.cwd(), 'supabase/migrations');
    if (!fs.existsSync(dir)) {
      console.log('[migrate] no supabase/migrations dir — skipping');
      return;
    }

    const files = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM migration_history',
    );
    const executed = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`[migrate] skip:  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf-8');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migration_history(filename) VALUES($1) ON CONFLICT DO NOTHING',
          [file],
        );
        console.log(`[migrate] done:  ${file}`);
      } catch (err) {
        const pgCode = (err as { code?: string }).code ?? '';
        if (ALREADY_EXISTS_CODES.has(pgCode)) {
          // Schema is already in the desired state — record and continue
          console.warn(`[migrate] already applied (pg ${pgCode}): ${file}`);
          await client.query(
            'INSERT INTO migration_history(filename) VALUES($1) ON CONFLICT DO NOTHING',
            [file],
          );
        } else {
          console.error(`[migrate] FAILED: ${file}`, err);
          throw err;
        }
      }
    }

    console.log('[migrate] all migrations complete');
  } finally {
    await client.end().catch(() => {});
  }
}
