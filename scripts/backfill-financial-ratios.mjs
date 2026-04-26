#!/usr/bin/env node
/**
 * scripts/backfill-financial-ratios.mjs
 *
 * Financial Ratios 개념 카드를 concept_extractions 테이블에 직접 INSERT하고
 * 각 카드마다 Claude Haiku로 example_question을 생성해 함께 저장한다.
 *
 * Requirements: Node 18+ (native fetch + top-level await)
 *
 * Env vars (scripts/.env.script):
 *   SUPABASE_URL           — Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_KEY   — service_role key (RLS 우회)
 *   ANTHROPIC_API_KEY      — Anthropic API key
 *   USER_ID                — 삽입 대상 유저의 Supabase user UUID
 *
 * Usage:
 *   node scripts/backfill-financial-ratios.mjs            # 실제 실행
 *   node scripts/backfill-financial-ratios.mjs --dry-run  # 삽입 없이 목록만 출력
 *   node scripts/backfill-financial-ratios.mjs --overwrite # 이미 존재해도 재삽입
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
const USER_ID = process.env.USER_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY || !USER_ID) {
  console.error(`
Missing required env vars. Add to scripts/.env.script:

  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...service_role_key...
  ANTHROPIC_API_KEY=sk-ant-...
  USER_ID=<your-supabase-user-uuid>
`)
  process.exit(1)
}

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const OVERWRITE = args.includes('--overwrite')
const DELAY_MS = 500

// ── Financial Ratio Cards (static seed data) ──────────────────
// topic_id: F1-M8 "Ratio & Variance Analysis" (Becker FAR Section 1)
const TOPIC_ID = 'F1-M8'

const RATIO_CARDS = [
  // ── 1. Liquidity Ratios ──────────────────────────────────────
  {
    key: 'liquidity',
    concepts: ['Current Ratio', 'Quick Ratio', 'Acid-Test Ratio', 'Working Capital', 'Liquidity Ratios'],
    topic_tags: ['Liquidity Ratios', 'Financial Ratios', 'Financial Statement Analysis'],
    trap_pattern: 'Quick Ratio excludes Inventory AND Prepaid Expenses — not just Inventory; Working Capital is a dollar amount, not a ratio',
    journal_entry: null,
    formula: 'Current Ratio = Current Assets ÷ Current Liabilities | Quick Ratio = (Cash + Short-term Investments + Net AR) ÷ Current Liabilities | Working Capital = Current Assets − Current Liabilities',
    related_concepts: ['AR Turnover', 'Cash Conversion Cycle', 'Operating Cycle'],
    description: 'Liquidity: Current Ratio / Quick Ratio / Working Capital',
  },

  // ── 2. AR Turnover & DSO ─────────────────────────────────────
  {
    key: 'ar-turnover',
    concepts: ['AR Turnover', 'Days Sales Outstanding', 'DSO', 'Receivables Turnover'],
    topic_tags: ['Activity Ratios', 'Turnover Ratios', 'Financial Statement Analysis'],
    trap_pattern: 'AR Turnover denominator = Average Net AR (beginning + ending ÷ 2), NOT ending AR; numerator = Net Credit Sales, not total sales',
    journal_entry: null,
    formula: 'AR Turnover = Net Credit Sales ÷ Average Net AR | DSO = 365 ÷ AR Turnover',
    related_concepts: ['Inventory Turnover', 'Cash Conversion Cycle', 'Allowance for Doubtful Accounts'],
    description: 'Activity: AR Turnover + Days Sales Outstanding (DSO)',
  },

  // ── 3. Inventory Turnover & DIO ──────────────────────────────
  {
    key: 'inventory-turnover',
    concepts: ['Inventory Turnover', 'Days Inventory Outstanding', 'DIO', 'Days in Inventory'],
    topic_tags: ['Activity Ratios', 'Turnover Ratios', 'Financial Statement Analysis'],
    trap_pattern: 'Inventory Turnover numerator = COGS (not Net Sales); higher turnover = faster-moving inventory = better efficiency',
    journal_entry: null,
    formula: 'Inventory Turnover = COGS ÷ Average Inventory | DIO = 365 ÷ Inventory Turnover',
    related_concepts: ['AR Turnover', 'Cash Conversion Cycle', 'LIFO Reserve Impact on Ratios'],
    description: 'Activity: Inventory Turnover + Days Inventory Outstanding (DIO)',
  },

  // ── 4. AP Turnover / DPO / Cash Conversion Cycle ─────────────
  {
    key: 'cash-conversion-cycle',
    concepts: ['AP Turnover', 'Days Payable Outstanding', 'DPO', 'Cash Conversion Cycle', 'CCC', 'Operating Cycle'],
    topic_tags: ['Activity Ratios', 'Cash Cycle', 'Financial Statement Analysis'],
    trap_pattern: 'CCC = DIO + DSO − DPO (DPO is SUBTRACTED, not added); longer CCC = more cash tied up = worse; increasing DPO improves (shortens) CCC',
    journal_entry: null,
    formula: 'AP Turnover = Purchases ÷ Average AP | DPO = 365 ÷ AP Turnover | CCC = DIO + DSO − DPO | Operating Cycle = DIO + DSO',
    related_concepts: ['AR Turnover', 'Inventory Turnover', 'Liquidity Ratios'],
    description: 'Activity: AP Turnover + DPO + Cash Conversion Cycle',
  },

  // ── 5. ROE / ROA / DuPont ────────────────────────────────────
  {
    key: 'roe-roa',
    concepts: ['Return on Equity', 'ROE', 'Return on Assets', 'ROA', 'DuPont Analysis'],
    topic_tags: ['Profitability Ratios', 'Financial Statement Analysis'],
    trap_pattern: 'ROA and ROE both use AVERAGE (not ending) balance of assets/equity; ROE ≠ ROA when leverage exists — DuPont shows ROE = Net Margin × Asset Turnover × Equity Multiplier',
    journal_entry: null,
    formula: 'ROE = Net Income ÷ Average Stockholders\' Equity | ROA = Net Income ÷ Average Total Assets | DuPont ROE = (NI/Sales) × (Sales/Assets) × (Assets/Equity)',
    related_concepts: ['Net Profit Margin', 'Debt-to-Equity Ratio', 'EPS'],
    description: 'Profitability: ROE + ROA + DuPont',
  },

  // ── 6. Margin Ratios ─────────────────────────────────────────
  {
    key: 'margins',
    concepts: ['Gross Profit Margin', 'Operating Margin', 'Net Profit Margin', 'Profitability Ratios'],
    topic_tags: ['Profitability Ratios', 'Financial Statement Analysis'],
    trap_pattern: 'Gross Margin = (Sales − COGS) ÷ Sales (excludes SG&A); Operating Margin deducts SG&A and D&A but not interest/taxes; Net Margin is the bottom line after everything',
    journal_entry: null,
    formula: 'Gross Margin = Gross Profit ÷ Net Sales | Operating Margin = Operating Income ÷ Net Sales | Net Profit Margin = Net Income ÷ Net Sales',
    related_concepts: ['ROA', 'ROE', 'EBITDA'],
    description: 'Profitability: Gross Margin / Operating Margin / Net Profit Margin',
  },

  // ── 7. Leverage Ratios ───────────────────────────────────────
  {
    key: 'leverage',
    concepts: ['Debt-to-Equity Ratio', 'Interest Coverage Ratio', 'Times Interest Earned', 'Financial Leverage', 'Solvency Ratios'],
    topic_tags: ['Leverage Ratios', 'Solvency', 'Financial Statement Analysis'],
    trap_pattern: 'Interest Coverage = EBIT ÷ Interest Expense (uses EBIT not Net Income); D/E exam may specify total debt vs. long-term debt only — read carefully',
    journal_entry: null,
    formula: 'Debt-to-Equity = Total Debt ÷ Total Stockholders\' Equity | Interest Coverage (TIE) = EBIT ÷ Interest Expense',
    related_concepts: ['ROE', 'DuPont Analysis', 'Debt Ratio'],
    description: 'Leverage: Debt-to-Equity + Interest Coverage (TIE)',
  },
]

// ── Supabase helpers ──────────────────────────────────────────
const SB_HEADERS = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...SB_HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`)
}

// ── Check existing cards ──────────────────────────────────────
async function getExistingKeys() {
  // 이미 삽입된 카드를 trap_pattern으로 구별 (concepts 배열 첫 값으로 체크)
  const rows = await sbGet(
    `concept_extractions?select=id,concepts&user_id=eq.${USER_ID}&topic_id=eq.${TOPIC_ID}`
  )
  const existing = new Set()
  for (const row of rows) {
    if (Array.isArray(row.concepts)) {
      existing.add(row.concepts[0])
    }
  }
  return existing
}

// ── Haiku: generate example_question ─────────────────────────
async function generateExampleQuestion(concepts, trapPattern) {
  const conceptList = concepts.slice(0, 6).join(', ')
  const trapLine = trapPattern ? `\nTrap pattern to include as a wrong option: ${trapPattern}` : ''

  const prompt = `Generate one FAR MCQ-style practice question in English.

Concepts to test: ${conceptList}${trapLine}

Rules:
- Question and 4 options must be in English
- Keep it concept-based (ratio formula or interpretation), solvable in ≤30 seconds if you know the concept
- Include exactly one trap option that tests the common mistake described in trap pattern
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
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  const parsed = JSON.parse(cleaned)
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
    throw new Error('Invalid example_question shape: ' + JSON.stringify(parsed).slice(0, 120))
  }

  return {
    question: parsed,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
}

// ── Main ──────────────────────────────────────────────────────
console.log(`\n📊 Financial Ratios Backfill`)
console.log(`   User ID : ${USER_ID}`)
console.log(`   Topic   : ${TOPIC_ID} (Ratio & Variance Analysis)`)
console.log(`   Cards   : ${RATIO_CARDS.length}개`)
console.log(`   Mode    : ${DRY_RUN ? 'DRY-RUN' : OVERWRITE ? 'OVERWRITE' : '신규만'}\n`)

if (DRY_RUN) {
  console.log('[DRY-RUN] 실제 삽입 없이 카드 목록만 출력:\n')
  for (const card of RATIO_CARDS) {
    console.log(`  [${card.key}] ${card.description}`)
    console.log(`    concepts : ${card.concepts.join(', ')}`)
    console.log(`    formula  : ${card.formula.split('|')[0].trim()}`)
    console.log(`    trap     : ${card.trap_pattern.slice(0, 80)}...`)
    console.log()
  }
  process.exit(0)
}

const existingFirstConcepts = OVERWRITE ? new Set() : await getExistingKeys()

let inserted = 0, skipped = 0, failed = 0
let totalIn = 0, totalOut = 0

for (const card of RATIO_CARDS) {
  const firstConcept = card.concepts[0]

  if (!OVERWRITE && existingFirstConcepts.has(firstConcept)) {
    console.log(`⏭  [${card.key}] 이미 존재 — skip (--overwrite로 재생성 가능)`)
    skipped++
    continue
  }

  console.log(`\n🔄 [${card.key}] ${card.description}`)

  try {
    // Step 1: Insert concept_extractions row
    const newRow = {
      user_id: USER_ID,
      topic_id: TOPIC_ID,
      concepts: card.concepts,
      topic_tags: card.topic_tags,
      trap_pattern: card.trap_pattern,
      journal_entry: card.journal_entry,
      formula: card.formula,
      related_concepts: card.related_concepts,
      asc_references: [],
      was_wrong: null,
      triggers: [],
      review_interval: 0,
      review_count: 0,
      next_review_at: new Date().toISOString(),
    }

    const [inserted_row] = await sbPost('concept_extractions', newRow)
    const rowId = inserted_row?.id
    console.log(`  ✅ INSERT  id=${rowId?.slice(0, 8)}`)

    // Step 2: Generate example_question via Haiku
    if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS))

    const { question: eq, inputTokens, outputTokens } = await generateExampleQuestion(
      card.concepts,
      card.trap_pattern,
    )

    await sbPatch(`concept_extractions?id=eq.${rowId}`, { example_question: eq })

    totalIn += inputTokens
    totalOut += outputTokens
    inserted++

    console.log(`  ✅ example_question 생성: "${eq.question.slice(0, 60)}..."`)
    console.log(`     정답: ${eq.answer} | memory: ${eq.explanation.memory}`)
  } catch (err) {
    failed++
    console.error(`  ❌ [${card.key}] ${err.message}`)
  }

  if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS))
}

// ── Summary ───────────────────────────────────────────────────
const actualCost = totalIn * 0.0000008 + totalOut * 0.000004
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 삽입 성공 : ${inserted}건
⏭  스킵      : ${skipped}건
❌ 실패      : ${failed}건
🔢 토큰      : input ${totalIn.toLocaleString()} / output ${totalOut.toLocaleString()}
💰 실제 비용 : $${actualCost.toFixed(4)} (Haiku 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

실행 후 복습 카드에서 확인하려면:
  → 앱 > 복습 탭 > F1-M8 카드 확인
`)
