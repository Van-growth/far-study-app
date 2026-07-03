// One-time fix: book_value_per_share example question correction
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// scripts/.env.script 로드 (dotenv 없이 최소 파서 — seed_topics.mjs와 동일 방식)
function loadEnv() {
  const envPath = resolve(__dirname, '.env.script')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY — scripts/.env.script를 확인하세요.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CORRECT_EQ = {
  question: "A corporation has the following stockholders' equity accounts: Common Stock $500,000 (50,000 shares issued), Additional Paid-in Capital $200,000, Retained Earnings $300,000, and Treasury Stock $80,000 (8,000 shares at cost). What is the book value per share?",
  options: ['A. $18.40', 'B. $20.00', 'C. $21.90', 'D. $23.81'],
  answer: 'C',
  explanation: {
    core: "Book value per share = Total Stockholders' Equity / Outstanding Shares; 발행주식수가 아닌 유통주식수(발행주식 − 자기주식)를 사용하고, 자기주식 금액을 총자본에서 차감해야 함.",
    calculation: "Total Equity = $500,000 + $200,000 + $300,000 − $80,000 = $920,000\nOutstanding Shares = 50,000 − 8,000 = 42,000 shares\nBook Value per Share = $920,000 / 42,000 = $21.90",
    traps: [
      "A: Issued shares(50,000)로 나눔: $920,000 / 50,000 = $18.40 (자기주식 개수 무시)",
      "B: Treasury stock 차감 안 함: $1,000,000 / 50,000 = $20.00",
      "D: Treasury stock 금액 차감 안 함: $1,000,000 / 42,000 = $23.81"
    ],
    memory: "자기주식은 금액을 총자본에서 빼고, 개수를 발행주식에서 뺀다 (두 개 모두!)"
  }
}

async function main() {
  // 1. Find matching records
  const { data: rows, error: fetchErr } = await supabase
    .from('concept_extractions')
    .select('id, example_question')
    .not('example_question', 'is', null)

  if (fetchErr) {
    console.error('Fetch error:', fetchErr)
    process.exit(1)
  }

  const targets = (rows ?? []).filter(row => {
    const q = row.example_question?.question ?? ''
    return (
      q.toLowerCase().includes('book value per share') &&
      q.toLowerCase().includes('treasury stock') &&
      q.includes('80,000')
    )
  })

  if (targets.length === 0) {
    console.log('No matching records found — nothing to update.')
    process.exit(0)
  }

  console.log(`Found ${targets.length} record(s) to update:`)
  targets.forEach(r => {
    console.log(` - ID: ${r.id}, current answer: ${r.example_question?.answer}`)
  })

  // 2. Update each record
  for (const row of targets) {
    const { error: updateErr } = await supabase
      .from('concept_extractions')
      .update({
        example_question: CORRECT_EQ,
        is_fixed: true,
        feedback: '정답 C ($21.90) 수정 — Treasury stock 금액과 주식 수 이중 차감 적용'
      })
      .eq('id', row.id)

    if (updateErr) {
      console.error(`Update failed for ${row.id}:`, updateErr)
    } else {
      console.log(`✅ Updated record ${row.id}`)
    }
  }
}

main().catch(console.error)
