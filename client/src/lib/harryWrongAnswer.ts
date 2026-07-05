import { supabase } from './supabase';
import { computeQuestionId } from './questionId';

// Harry가 STEP 0~4 설명 뒤에 붙이는 오답 자동기록용 JSON 코드펜스 — server/prompts/harry-system-prompt.md 참고.
const FENCE_LANG = 'harry-wronganswer-json';
const CLOSED_BLOCK_RE = new RegExp('```' + FENCE_LANG + '\\s*([\\s\\S]*?)```');
const ANY_CLOSED_BLOCK_RE = new RegExp('```' + FENCE_LANG + '[\\s\\S]*?```', 'g');
const UNCLOSED_TAIL_RE = new RegExp('```' + FENCE_LANG + '[\\s\\S]*$');

const VALID_ERROR_PATTERNS = ['개념혼동', '용어혼동', '계산실수', '공식불완전', '표현변환실수'] as const;
type ErrorPattern = (typeof VALID_ERROR_PATTERNS)[number];

export interface ParsedWrongAnswer {
  question_text: string;
  my_answer: string;
  correct_answer: string;
  explanation: string;
  topic_tag: string | null;
  error_pattern: ErrorPattern;
  trigger_phrase: string | null;
}

/** 화면 표시용 텍스트에서 오답 자동기록 JSON 블록을 제거 (스트리밍 도중 아직 안 닫힌 블록도 제거). */
export function stripWrongAnswerJson(text: string): string {
  return text.replace(ANY_CLOSED_BLOCK_RE, '').replace(UNCLOSED_TAIL_RE, '').trimEnd();
}

/** Harry 응답 전체 텍스트에서 오답 자동기록 JSON 블록을 파싱. 없거나 형식이 안 맞으면 null. */
export function parseWrongAnswerBlock(fullText: string): ParsedWrongAnswer | null {
  const match = fullText.match(CLOSED_BLOCK_RE);
  if (!match) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[1].trim());
  } catch {
    return null;
  }

  const errorPattern = parsed.error_pattern;
  if (
    typeof parsed.question_text !== 'string' ||
    typeof parsed.my_answer !== 'string' ||
    typeof parsed.correct_answer !== 'string' ||
    typeof parsed.explanation !== 'string' ||
    typeof errorPattern !== 'string' ||
    !VALID_ERROR_PATTERNS.includes(errorPattern as ErrorPattern)
  ) {
    return null;
  }

  return {
    question_text: parsed.question_text,
    my_answer: parsed.my_answer,
    correct_answer: parsed.correct_answer,
    explanation: parsed.explanation,
    topic_tag: typeof parsed.topic_tag === 'string' ? parsed.topic_tag : null,
    error_pattern: errorPattern as ErrorPattern,
    trigger_phrase: typeof parsed.trigger_phrase === 'string' ? parsed.trigger_phrase : null,
  };
}

/** 파싱된 오답을 wrong_answers에 저장 (동일 문제가 이미 있으면 times_wrong만 증가). */
export async function saveWrongAnswer(
  parsed: ParsedWrongAnswer,
  userId: string,
  modelUsed: string | null,
): Promise<void> {
  const questionId = await computeQuestionId(parsed.question_text);

  const { data: existing, error: selectError } = await supabase
    .from('wrong_answers')
    .select('id, times_wrong')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (selectError) {
    console.warn('[harry] wrong_answers 조회 실패:', selectError.message);
    return;
  }

  if (existing) {
    const row = existing as { id: string; times_wrong: number | null };
    const { error } = await supabase
      .from('wrong_answers')
      .update({ times_wrong: (row.times_wrong ?? 1) + 1, is_resolved: false, model_used: modelUsed })
      .eq('id', row.id);
    if (error) console.warn('[harry] wrong_answers 업데이트 실패:', error.message);
    return;
  }

  const { error } = await supabase.from('wrong_answers').insert({
    user_id: userId,
    question_id: questionId,
    question_text: parsed.question_text,
    my_answer: parsed.my_answer,
    correct_answer: parsed.correct_answer,
    explanation: parsed.explanation,
    topic_tag: parsed.topic_tag,
    error_pattern: parsed.error_pattern,
    trigger_phrase: parsed.trigger_phrase,
    model_used: modelUsed,
  });
  if (error) console.warn('[harry] wrong_answers 저장 실패:', error.message);
}
