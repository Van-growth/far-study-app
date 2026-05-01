/**
 * backfill-one-liner.ts
 *
 * For every concept_extractions row that has example_question but no one_liner,
 * calls Haiku to produce a ≤30-char Korean one-liner summary of the explanation
 * and writes it back to the DB.
 *
 * Usage:
 *   npx ts-node src/scripts/backfill-one-liner.ts [--limit N] [--dry-run]
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../scripts/.env.script'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODEL = 'claude-haiku-4-5-20251001';

function extractExplanationText(explanation: unknown): string {
  if (typeof explanation === 'string') return explanation;
  if (typeof explanation === 'object' && explanation !== null) {
    const e = explanation as Record<string, unknown>;
    if (typeof e.core === 'string') return e.core;
    if (typeof e.text === 'string') return e.text;
  }
  return JSON.stringify(explanation);
}

async function summarise(explanation: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 80,
    system:
      'Summarize the key accounting rule in one line, max 15 words, English only, keep accounting terms as-is. Output the summary only.',
    messages: [{ role: 'user', content: explanation.slice(0, 800) }],
  });
  const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
  return text.slice(0, 120); // hard cap
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? '200') : 200;

  console.log(`\n=== backfill-one-liner ===`);
  console.log(`mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}  limit: ${limit}\n`);

  const { data, error } = await supabase
    .from('concept_extractions')
    .select('id, example_question')
    .not('example_question', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('DB fetch error:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []).filter(
    (r) =>
      r.example_question !== null &&
      typeof r.example_question === 'object' &&
      typeof (r.example_question as { explanation?: unknown }).explanation !== 'undefined',
  );

  console.log(`대상: ${rows.length}건\n`);

  let written = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const eq = row.example_question as { explanation?: unknown };
    const expText = extractExplanationText(eq.explanation);

    process.stdout.write(`[${i + 1}/${rows.length}] ${(row.id as string).slice(0, 8)}… `);

    try {
      const oneLiner = await summarise(expText);
      console.log(`"${oneLiner}"`);

      if (!dryRun) {
        const { error: upErr } = await supabase
          .from('concept_extractions')
          .update({ one_liner: oneLiner })
          .eq('id', row.id);
        if (upErr) {
          console.error(`  [DB ERROR] ${upErr.message}`);
          failed++;
        } else {
          written++;
        }
      } else {
        written++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ERROR: ${msg}`);
      failed++;
    }

    // Haiku has higher RPM but be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n=== 완료 ===`);
  console.log(`처리: ${rows.length}건  ${dryRun ? '(dry-run) 예상 쓰기' : '쓰기'}: ${written}건  실패: ${failed}건`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
