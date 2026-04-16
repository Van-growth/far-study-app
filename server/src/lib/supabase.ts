import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Server-side Supabase client (service role key — RLS bypass)
// concept_extractions 집계 조회용. 환경변수 없으면 null → fallback.
// ─────────────────────────────────────────────────────────────
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

if (!supabase) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_SERVICE_KEY not set — concept_extractions 조회 비활성',
  );
}

export interface ConceptExtraction {
  concepts: string[];
  asc_references: string[];
  topic_tags: string[];
  trap_pattern: string | null;
}

/**
 * topicId에 해당하는 최근 concept_extractions 20건 조회.
 * 실패 시 빈 배열 반환 (never throws).
 */
export async function fetchConceptExtractions(
  topicId: string,
): Promise<ConceptExtraction[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('concepts, asc_references, topic_tags, trap_pattern')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.warn('[supabase] fetchConceptExtractions error:', error.message);
      return [];
    }
    return (data ?? []) as ConceptExtraction[];
  } catch (e) {
    console.warn('[supabase] fetchConceptExtractions exception:', e);
    return [];
  }
}

/**
 * concept_extractions 집계 → 프롬프트 주입용 문자열.
 * concepts 빈도순 top 8, trap_pattern top 5.
 * 데이터 없으면 null.
 */
export function buildExtractionContext(
  rows: ConceptExtraction[],
): string | null {
  if (rows.length === 0) return null;

  // concepts 빈도 집계
  const conceptCounts = new Map<string, number>();
  const ascSet = new Set<string>();
  const tagSet = new Set<string>();
  const traps: string[] = [];

  for (const row of rows) {
    for (const c of row.concepts) {
      conceptCounts.set(c, (conceptCounts.get(c) ?? 0) + 1);
    }
    for (const a of row.asc_references) ascSet.add(a);
    for (const t of row.topic_tags) tagSet.add(t);
    if (row.trap_pattern) traps.push(row.trap_pattern);
  }

  const topConcepts = [...conceptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // trap 중복 제거 (앞 5개)
  const uniqueTraps = [...new Set(traps)].slice(0, 5);

  if (topConcepts.length === 0 && uniqueTraps.length === 0) return null;

  const parts: string[] = [];
  if (topConcepts.length) {
    parts.push(
      `이 모듈에서 학생이 자주 틀린 개념: ${topConcepts.map(([k, n]) => `${k}(${n}회)`).join(', ')}`,
    );
  }
  if (ascSet.size) {
    parts.push(`관련 ASC: ${[...ascSet].slice(0, 6).join(', ')}`);
  }
  if (tagSet.size) {
    parts.push(`핵심 주제: ${[...tagSet].slice(0, 6).join(', ')}`);
  }
  if (uniqueTraps.length) {
    parts.push(`자주 걸리는 함정: ${uniqueTraps.join(' / ')}`);
  }
  parts.push(
    '위 개념/함정을 의도적으로 포함하는 문제로 출제. 단, 개념 이름은 문제 stem에 직접 언급하는 것 금지.',
  );

  return parts.join('\n');
}
