#!/usr/bin/env node
/**
 * scripts/backfill-journal.mjs
 *
 * concept_extractions 테이블에서 journal_entry가 null인 카드에
 * Claude Haiku를 호출해 journal_entry / formula / related_concepts를 일괄 생성한다.
 *
 * Requirements: Node 18+ (native fetch + top-level await)
 *
 * Env vars (scripts/.env.script 또는 환경변수):
 *   SUPABASE_URL           — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_KEY   — service_role key (RLS 우회)
 *   ANTHROPIC_API_KEY      — Anthropic API key
 *
 * Usage:
 *   node scripts/backfill-journal.mjs            # 실제 실행
 *   node scripts/backfill-journal.mjs --dry-run  # 대상 목록만 출력
 *   node scripts/backfill-journal.mjs --limit 20 # 최대 20건만
 *   node scripts/backfill-journal.mjs --overwrite # journal_entry 있는 것도 재생성
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Env loader ────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '.env.script')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) {
  console.error(`
Missing required env vars. Create scripts/.env.script with:

  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...service_role_key...
  ANTHROPIC_API_KEY=sk-ant-...
`)
  process.exit(1)
}

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const OVERWRITE = args.includes('--overwrite')
const limitArg = args.indexOf('--limit')
const HARD_LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : 500
const BATCH_SIZE = 5     // API calls per batch (journal 응답이 더 길어서 보수적)
const DELAY_MS = 400     // ms between Haiku calls

// ── Supabase helpers ──────────────────────────────────────────
const SB_HEADERS = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`)
}

// ── Haiku call ────────────────────────────────────────────────
async function generateJournalFields(row) {
  const concepts = (row.concepts ?? []).slice(0, 8).join(', ')
  const trap = row.trap_pattern ?? ''
  const topic = row.topic_id ?? ''

  const prompt = `You are a CPA FAR exam expert. Given an accounting concept card, generate three fields.

Concept info:
- Topic ID: ${topic}
- Concepts: ${concepts}
- Trap pattern: ${trap}

Generate:

1. journal_entry (string | null)
   The key Dr/Cr journal entry in plain text.
   Format: Dr lines unindented, Cr lines indented with 2 spaces.
   Example:
     Dr. Cash
     Dr. Loss on Sale of A/R
       Cr. Accounts Receivable
   Use account names only (no amounts). If no journal entry applies (e.g. disclosure-only topics, goodwill impairment test, revenue recognition step logic), return null.

2. formula (string | null)
   One-line key calculation formula. Example: "NRV = Gross A/R − Allowance for Doubtful Accounts"
   Return null if the concept is not calculation-based.

3. related_concepts (string[])
   Array of 2–3 closely related FAR concept names that are commonly confused with this one.
   Use short specific names like "A/R Factoring — Sale", "Deferred Tax Liability", "Operating Lease (ASC 842)".
   Do NOT include generic terms like "GAAP" or "Revenue Recognition".

Output ONLY valid JSON, no markdown fences:
{"journal_entry":"Dr. ...\\n  Cr. ..." ,"formula":"..." or null,"related_concepts":["...","..."]}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  const parsed = JSON.parse(match[0])

  // Validate shape
  if (
    !('journal_entry' in parsed) ||
    !('formula' in parsed) ||
    !Array.isArray(parsed.related_concepts)
  ) {
    throw new Error('Invalid response shape: ' + JSON.stringify(parsed).slice(0, 120))
  }

  return {
    journal_entry: typeof parsed.journal_entry === 'string' ? parsed.journal_entry : null,
    formula: typeof parsed.formula === 'string' ? parsed.formula : null,
    related_concepts: parsed.related_concepts.filter((c) => typeof c === 'string'),
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
}

// ── Main ──────────────────────────────────────────────────────
const fields = 'id,concepts,trap_pattern,topic_id'
const filter = OVERWRITE
  ? `concept_extractions?select=${fields}&order=created_at.asc&limit=${HARD_LIMIT}`
  : `concept_extractions?select=${fields}&journal_entry=is.null&order=created_at.asc&limit=${HARD_LIMIT}`

const rows = await sbGet(filter)

const modeLabel = OVERWRITE ? '전체(덮어쓰기)' : 'journal_entry=null만'
console.log(`\n📋 대상 카드 [${modeLabel}]: ${rows.length}건 (최대 ${HARD_LIMIT}건 처리)`)

if (DRY_RUN) {
  console.log('\n[DRY-RUN] 실제 API 호출 없이 종료.')
  for (const r of rows) {
    console.log(`  ${r.id.slice(0, 8)}  topic=${r.topic_id ?? '?'}  concepts: ${(r.concepts ?? []).slice(0, 3).join(', ')}`)
  }
  process.exit(0)
}

// Cost estimate (Haiku 4.5: $0.80/1M input, $4/1M output)
const estIn = 300, estOut = 120
const estCost = rows.length * (estIn * 0.0000008 + estOut * 0.000004)
console.log(`💰 예상 비용: $${estCost.toFixed(4)} (Haiku 기준)\n`)

let successCount = 0, failCount = 0
let totalIn = 0, totalOut = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)
  console.log(`\n🔄 Batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)}  (${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)})`)

  for (const row of batch) {
    if (!row.concepts?.length) {
      console.log(`  ⏭  ${row.id.slice(0, 8)}  concepts 없음 — skip`)
      continue
    }

    try {
      const { journal_entry, formula, related_concepts, inputTokens, outputTokens } =
        await generateJournalFields(row)

      await sbPatch(`concept_extractions?id=eq.${row.id}`, {
        journal_entry,
        formula,
        related_concepts: related_concepts.length > 0 ? related_concepts : null,
      })

      totalIn += inputTokens
      totalOut += outputTokens
      successCount++

      const jePreview = journal_entry ? journal_entry.split('\n')[0] : 'null'
      console.log(`  ✅ ${row.id.slice(0, 8)}  je="${jePreview}"  formula=${formula ? '"' + formula.slice(0, 30) + '..."' : 'null'}  related=${related_concepts.length}개`)
    } catch (err) {
      failCount++
      console.error(`  ❌ ${row.id.slice(0, 8)}  ${err.message}`)
    }

    if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS))
  }
}

// ── Summary ───────────────────────────────────────────────────
const actualCost = totalIn * 0.0000008 + totalOut * 0.000004
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 성공: ${successCount}건
❌ 실패: ${failCount}건
🔢 토큰: input ${totalIn.toLocaleString()} / output ${totalOut.toLocaleString()}
💰 실제 비용: $${actualCost.toFixed(4)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
