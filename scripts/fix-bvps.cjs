// One-time DB fix: book_value_per_share example question
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

const newEq = {
  question: "A corporation has the following stockholders' equity accounts: Common Stock $500,000 (50,000 shares issued), Additional Paid-in Capital $200,000, Retained Earnings $300,000, and Treasury Stock $80,000 (8,000 shares at cost). What is the book value per share?",
  options: ['A. $18.40', 'B. $20.00', 'C. $21.90', 'D. $23.81'],
  answer: 'C',
  explanation: {
    core: "Book value per share = Total Stockholders' Equity / Outstanding Shares; 발행주식수가 아닌 유통주식수(발행주식 - 자기주식)를 사용하고, 자기주식 금액을 총자본에서 차감해야 함.",
    calculation: "Total Equity = $500,000 + $200,000 + $300,000 - $80,000 = $920,000\nOutstanding Shares = 50,000 - 8,000 = 42,000 shares\nBook Value per Share = $920,000 / 42,000 = $21.90",
    traps: [
      'A: Issued shares(50,000)로 나눔: $920,000 / 50,000 = $18.40 (자기주식 개수 무시)',
      'B: Treasury stock 차감 안 함: $1,000,000 / 50,000 = $20.00',
      'D: Treasury stock 금액 차감 안 함: $1,000,000 / 42,000 = $23.81'
    ],
    memory: '자기주식은 금액을 총자본에서 빼고, 개수를 발행주식에서 뺀다 (두 개 모두!)'
  }
}

supabase
  .from('concept_extractions')
  .update({
    example_question: newEq,
    is_fixed: true,
    feedback: '정답 C ($21.90) 수정 확인 — Treasury stock 금액과 주식 수 이중 차감 적용'
  })
  .eq('id', '0eaebf9c-64eb-4944-936b-25f54ed32a3c')
  .then(function(result) {
    var error = result.error
    if (error) console.error('Update failed:', JSON.stringify(error))
    else console.log('DB update successful! Record 0eaebf9c updated.')
  })
  .catch(function(e) { console.error(e) })
