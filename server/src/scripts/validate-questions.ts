/**
 * validate-questions.ts
 *
 * Fetches all concept_extractions with example_question and uses Sonnet
 * to verify logical consistency of: question stem / options / answer / explanation.
 * Flags inconsistent items and optionally auto-fixes them in the DB.
 *
 * Usage:
 *   npx ts-node src/scripts/validate-questions.ts [--fix] [--limit N] [--topic TOPIC_ID]
 *
 * Flags:
 *   --fix      Write corrected records back to DB (default: dry-run only)
 *   --limit N  Process at most N records (default: 50)
 *   --topic ID Filter by topic_id
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// scripts/.env.script has the current API keys; load it last with override so it wins
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../scripts/.env.script'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing required env vars:');
  if (!SUPABASE_URL) console.error('  SUPABASE_URL');
  if (!SUPABASE_KEY) console.error('  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  if (!ANTHROPIC_KEY) console.error('  ANTHROPIC_API_KEY');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ExampleQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: unknown;
}

interface ExtractionRow {
  id: string;
  topic_id: string;
  example_question: ExampleQuestion;
  is_fixed: boolean | null;
}

interface ValidationResult {
  id: string;
  topic_id: string;
  valid: boolean;
  issues: string[];
  corrected?: {
    answer?: string;
    explanation?: string;
    options?: string[];
  };
}

const SYSTEM = `너는 USCPA FAR 시험 문제 품질 검수 에이전트야. US GAAP 기준으로 판단해.

주어진 문제의 논리적 일치성을 검증해:
1. 문제 지문(stem)이 명확하고 단일 정답을 특정할 수 있는가?
2. 선지(options)가 4개이고 중복이 없는가?
3. 정답(answer)이 선지 중 하나와 일치하는가?
4. 해설(explanation)이 정답을 올바르게 뒷받침하는가?
5. 오답 선지가 그럴듯한 오답인가? (너무 쉽거나 명백하게 틀린 선지 여부)

반드시 JSON만 반환. 마크다운 펜스 금지.

형식:
{
  "valid": true | false,
  "issues": ["이슈1", "이슈2"],
  "corrected": {
    "answer": "수정된 정답 (예: A) — 수정 필요할 때만 포함",
    "explanation": "수정된 해설 — 수정 필요할 때만 포함",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."] — 선지 수정 필요할 때만 포함
  }
}

valid=true면 corrected 생략 가능. issues는 빈 배열([])도 OK.`;

function extractExplanationText(explanation: unknown): string {
  if (typeof explanation === 'string') return explanation;
  if (typeof explanation === 'object' && explanation !== null) {
    const e = explanation as Record<string, unknown>;
    if (typeof e.core === 'string') return e.core;
  }
  return JSON.stringify(explanation);
}

async function validateOne(row: ExtractionRow): Promise<ValidationResult> {
  const eq = row.example_question;
  const optText = Array.isArray(eq.options) && eq.options.length > 0
    ? `\n선지:\n${eq.options.join('\n')}`
    : '(선지 없음)';
  const expText = extractExplanationText(eq.explanation);

  const userMsg = `문제: ${eq.question}${optText}
정답: ${eq.answer}
해설: ${expText}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { id: row.id, topic_id: row.topic_id, valid: false, issues: ['AI 응답 파싱 실패: ' + raw.slice(0, 100)] };
    }
    const parsed = JSON.parse(jsonMatch[0]) as {
      valid?: boolean;
      issues?: string[];
      corrected?: { answer?: string; explanation?: string; options?: string[] };
    };
    return {
      id: row.id,
      topic_id: row.topic_id,
      valid: parsed.valid ?? true,
      issues: parsed.issues ?? [],
      corrected: parsed.corrected,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { id: row.id, topic_id: row.topic_id, valid: false, issues: ['API 오류: ' + msg] };
  }
}

async function applyFix(row: ExtractionRow, result: ValidationResult): Promise<void> {
  if (!result.corrected) return;
  const c = result.corrected;

  const current = row.example_question;
  const merged = {
    ...current,
    ...(c.answer ? { answer: c.answer } : {}),
    ...(c.explanation ? { explanation: c.explanation } : {}),
    ...(c.options ? { options: c.options } : {}),
  };

  const { error } = await supabase
    .from('concept_extractions')
    .update({
      example_question: merged,
      is_fixed: true,
      fixed_at: new Date().toISOString(),
      feedback: '자동 검수 스크립트에 의한 수정',
    })
    .eq('id', row.id);

  if (error) {
    console.error(`  [DB ERROR] ${row.id}:`, error.message);
  } else {
    console.log(`  [FIXED] ${row.id}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const doFix = args.includes('--fix');
  const unfixedOnly = args.includes('--unfixed-only');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? '50') : 50;
  const topicIdx = args.indexOf('--topic');
  const topicFilter = topicIdx >= 0 ? args[topicIdx + 1] : null;

  console.log(`\n=== validate-questions ===`);
  console.log(`mode: ${doFix ? 'FIX' : 'DRY-RUN'}  limit: ${limit}  topic: ${topicFilter ?? 'all'}  unfixed-only: ${unfixedOnly}\n`);

  let query = supabase
    .from('concept_extractions')
    .select('id, topic_id, example_question, is_fixed')
    .not('example_question', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (topicFilter) {
    query = query.eq('topic_id', topicFilter);
  }

  if (unfixedOnly) {
    query = query.or('is_fixed.is.null,is_fixed.eq.false');
  }

  const { data, error } = await query;
  if (error) {
    console.error('DB fetch error:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []).filter(
    (r): r is ExtractionRow =>
      r.example_question !== null &&
      typeof r.example_question === 'object' &&
      typeof (r.example_question as ExampleQuestion).question === 'string',
  );

  console.log(`검수 대상: ${rows.length}건\n`);

  const invalid: ValidationResult[] = [];
  let checked = 0;

  for (const row of rows) {
    checked++;
    process.stdout.write(`[${checked}/${rows.length}] ${row.id.slice(0, 8)}… `);

    const result = await validateOne(row);

    if (result.valid && result.issues.length === 0) {
      console.log('✅ OK');
    } else {
      console.log(`❌ ISSUES (${result.issues.length})`);
      for (const issue of result.issues) {
        console.log(`  - ${issue}`);
      }
      if (result.corrected) {
        console.log(`  → 수정안 있음`);
      }
      invalid.push(result);

      if (doFix && result.corrected) {
        await applyFix(row, result);
      }
    }

    // Rate limiting — Sonnet has lower RPM
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== 결과 요약 ===`);
  console.log(`검수: ${checked}건  불일치: ${invalid.length}건  수정됨: ${doFix ? invalid.filter((r) => r.corrected).length : 0}건`);

  if (invalid.length > 0) {
    console.log('\n불일치 목록:');
    for (const r of invalid) {
      console.log(`  ${r.topic_id} / ${r.id}: ${r.issues.join(' | ')}`);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
