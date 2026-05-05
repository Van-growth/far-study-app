#!/usr/bin/env node
/**
 * scripts/seed_topics.mjs
 *
 * professor_ssot.ts의 각 [topic_id] 블록을 파싱해서
 * Supabase topics 테이블에 upsert한다.
 *
 * Usage:
 *   node scripts/seed_topics.mjs            # 실제 실행
 *   node scripts/seed_topics.mjs --dry-run  # 파싱 결과만 출력
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
const DRY_RUN = process.argv.includes('--dry-run')

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
  console.error(`
Missing required env vars. Create scripts/.env.script with:

  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...service_role_key...
`)
  process.exit(1)
}

// ── Parse professor_ssot.ts ────────────────────────────────────
function parseSSOT() {
  const ssotPath = resolve(__dirname, '../client/src/constants/professor_ssot.ts')
  const raw = readFileSync(ssotPath, 'utf8')

  // 템플릿 리터럴 내용만 추출
  const match = raw.match(/PROFESSOR_SSOT\s*=\s*`([\s\S]*)`/)
  if (!match) throw new Error('PROFESSOR_SSOT 템플릿 리터럴을 찾을 수 없습니다.')
  const content = match[1]

  const topics = []
  // 각 블록: ====...==== // [ID] name — summary ====...==== ... 다음 ====까지
  const blockRegex = /={10,}\n\/\/ \[([A-Z_0-9]+)\] (.+?)(?:\s+—\s+(.+?))?\n={10,}\n([\s\S]*?)(?=={10,}|$)/g

  let m
  while ((m = blockRegex.exec(content)) !== null) {
    const [, topicId, topicName, summary, body] = m
    const category = topicId.split('_')[0]

    const topic = {
      topic_id: topicId,
      category,
      topic_name: topicName.trim(),
      summary: summary ? summary.trim() : null,
      rule: null,
      trigger_keywords: null,
      trap: null,
      example: null,
      exam_section: 'FAR',
    }

    // 필드 파싱: RULE / TRIGGER / TRAP / EXAMPLE
    // 각 필드는 "FIELDNAME : 값" 으로 시작하고, 다음 필드 또는 끝까지 이어짐
    const fieldRegex = /^(RULE|TRIGGER|TRAP|EXAMPLE)\s*:\s*([\s\S]*?)(?=\n(?:RULE|TRIGGER|TRAP|EXAMPLE)\s*:|$)/gm
    let fm
    while ((fm = fieldRegex.exec(body)) !== null) {
      const [, field, rawVal] = fm
      // 연속 공백·들여쓰기 정리: 첫 줄 + 이어지는 들여쓰기 줄들
      const val = rawVal
        .split('\n')
        .map(l => l.trimStart())
        .join('\n')
        .trim()

      if (field === 'RULE') topic.rule = val
      else if (field === 'TRAP') topic.trap = val
      else if (field === 'EXAMPLE') topic.example = val
      else if (field === 'TRIGGER') {
        // "keyword1" "keyword2" 형태 파싱
        const keywords = [...val.matchAll(/"([^"]+)"/g)].map(k => k[1])
        topic.trigger_keywords = keywords.length > 0 ? keywords : [val.trim()]
      }
    }

    topics.push(topic)
  }

  return topics
}

// ── Supabase upsert ───────────────────────────────────────────
async function supabaseUpsert(topics) {
  const url = `${SUPABASE_URL}/rest/v1/topics`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(topics),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase upsert 실패 (${res.status}): ${err}`)
  }
  return res
}

// ── Main ──────────────────────────────────────────────────────
const topics = parseSSOT()

console.log(`\n파싱된 토픽 수: ${topics.length}개\n`)
console.log('─'.repeat(60))
for (const t of topics) {
  console.log(`[${t.topic_id}] ${t.topic_name} — ${t.summary}`)
  console.log(`  category : ${t.category}`)
  console.log(`  triggers : ${(t.trigger_keywords || []).join(', ')}`)
  console.log(`  rule     : ${t.rule ? t.rule.slice(0, 60) + '...' : '(없음)'}`)
  console.log(`  trap     : ${t.trap ? t.trap.slice(0, 60) + '...' : '(없음)'}`)
  console.log(`  example  : ${t.example ? t.example.slice(0, 60) + '...' : '(없음)'}`)
  console.log()
}

if (DRY_RUN) {
  console.log('✅ --dry-run 모드: DB에 쓰지 않았습니다.')
  process.exit(0)
}

console.log('Supabase topics 테이블에 upsert 중...')
await supabaseUpsert(topics)
console.log(`✅ ${topics.length}개 토픽 upsert 완료!`)
