/**
 * wrong_answers.question_id 생성 — question_text를 정규화(trim/공백정리/소문자) 후
 * SHA-256 앞 16자로 해시. supabase/migrations/039_wrong_answers_question_id.sql의
 * 백필 SQL과 정규화 규칙이 반드시 동일해야 기존 데이터와 신규 저장이 같은 식별자로 매칭된다.
 */
export async function computeQuestionId(questionText: string): Promise<string> {
  const normalized = questionText.trim().toLowerCase().replace(/\s+/g, ' ');
  const bytes = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}
