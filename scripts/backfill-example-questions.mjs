#!/usr/bin/env node
/**
 * scripts/backfill-example-questions.mjs
 *
 * concept_extractions 테이블에서 example_question이 null인 카드에
 * Claude Haiku를 호출해 예시 문제를 일괄 생성하고 저장한다.
 *
 * Requirements: Node 18+ (native fetch + top-level await)
 *
 * Env vars (스크립트 실행 디렉토리의 .env.script 파일 또는 환경변수로):
 *   SUPABASE_URL           — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_KEY   — service_role key (RLS 우회용)
 *   ANTHROPIC_API_KEY      — Anthropic API key
 *
 * Usage:
 *   node scripts/backfill-example-questions.mjs            # 실제 실행
 *   node scripts/backfill-example-questions.mjs --dry-run  # 대상 목록만 출력
 *   node scripts/backfill-example-questions.mjs --limit 20 # 최대 20건만
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
const OVERWRITE = args.includes('--overwrite')   // overwrite existing example_question too
const limitArg = args.indexOf('--limit')
const HARD_LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : 300
const BATCH_SIZE = 10       // API calls per batch
const DELAY_MS = 300        // ms between Haiku calls

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
async function generateExampleQuestion(concepts, trapPattern) {
  const conceptList = concepts.slice(0, 6).join(', ')
  const trapLine = trapPattern ? `\nTrap pattern to include as a wrong option: ${trapPattern}` : ''

  const prompt = `Generate one FAR MCQ-style practice question in English.

Concepts to test: ${conceptList}${trapLine}

Rules:
- Question and 4 options must be in English
- Keep it concept-based, solvable in ≤3 seconds if you know the concept
- Include exactly one trap option
- traps array: one entry per wrong option (e.g. "A: why wrong"), skip correct option
- calculation: multi-line string if numeric steps needed, otherwise null
- memory: one Korean sentence summarizing the key takeaway

Output ONLY valid JSON, no markdown fences:
{"question":"...(English)...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"C","explanation":{"core":"one-line key reason (English)","calculation":"step-by-step or null","traps":["A: ...","B: ...","D: ..."],"memory":"한 줄 핵심 포인트 (Korean)"}}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  // Extract first {...} block to handle extra text after JSON
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  const parsed = JSON.parse(match[0])

  const exp = parsed.explanation
  if (
    typeof parsed.question !== 'string' ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 4 ||
    typeof parsed.answer !== 'string' ||
    typeof exp !== 'object' || exp === null ||
    typeof exp.core !== 'string' ||
    !Array.isArray(exp.traps) ||
    typeof exp.memory !== 'string'
  ) {
    throw new Error('Invalid response shape')
  }

  const inputTokens = data.usage?.input_tokens ?? 0
  const outputTokens = data.usage?.output_tokens ?? 0
  return { question: parsed, inputTokens, outputTokens }
}

// ── Main ──────────────────────────────────────────────────────
const filter = OVERWRITE
  ? `concept_extractions?select=id,concepts,trap_pattern&order=created_at.asc&limit=${HARD_LIMIT}`
  : `concept_extractions?select=id,concepts,trap_pattern&example_question=is.null&order=created_at.asc&limit=${HARD_LIMIT}`

const rows = await sbGet(filter)

const modeLabel = OVERWRITE ? '전체(덮어쓰기)' : 'null만'
console.log(`\n📋 대상 카드 [${modeLabel}]: ${rows.length}건 (최대 ${HARD_LIMIT}건 처리)`)
if (DRY_RUN) {
  console.log('\n[DRY-RUN] 실제 API 호출 없이 종료.')
  for (const r of rows) {
    console.log(`  ${r.id}  concepts: ${(r.concepts ?? []).slice(0, 2).join(', ')}`)
  }
  process.exit(0)
}

// Cost estimate (Haiku 4.5 pricing: $0.80/1M input, $4/1M output)
const estInputPerCard = 350  // approx tokens
const estOutputPerCard = 120
const estCost = rows.length * (estInputPerCard * 0.0000008 + estOutputPerCard * 0.000004)
console.log(`💰 예상 비용: $${estCost.toFixed(4)} (Haiku 기준, 실제와 다를 수 있음)\n`)

let successCount = 0
let failCount = 0
let totalInputTokens = 0
let totalOutputTokens = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)
  console.log(`\n🔄 Batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)}  (${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)})`)

  for (const row of batch) {
    const concepts = Array.isArray(row.concepts) ? row.concepts : []
    const trap = typeof row.trap_pattern === 'string' ? row.trap_pattern : null

    if (concepts.length === 0) {
      console.log(`  ⏭  ${row.id.slice(0, 8)}  concepts 없음 — skip`)
      continue
    }

    try {
      const { question, inputTokens, outputTokens } = await generateExampleQuestion(concepts, trap)
      await sbPatch(`concept_extractions?id=eq.${row.id}`, { example_question: question })

      totalInputTokens += inputTokens
      totalOutputTokens += outputTokens
      successCount++
      console.log(`  ✅ ${row.id.slice(0, 8)}  "${question.question.slice(0, 40)}..."`)
    } catch (err) {
      failCount++
      console.error(`  ❌ ${row.id.slice(0, 8)}  ${err.message}`)
    }

    if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS))
  }
}

// ── Summary ───────────────────────────────────────────────────
const actualCost = totalInputTokens * 0.0000008 + totalOutputTokens * 0.000004
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 성공: ${successCount}건
❌ 실패: ${failCount}건
🔢 토큰: input ${totalInputTokens.toLocaleString()} / output ${totalOutputTokens.toLocaleString()}
💰 실제 비용: $${actualCost.toFixed(4)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
