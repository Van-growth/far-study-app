import { supabase } from './supabase';

export interface TopicSearchResult {
  kind: 'topic';
  topic_id: string;
  topic_name: string;
  category: string | null;
}

export interface QuestionSearchResult {
  kind: 'question';
  id: string;
  question_text: string;
  topic_id: string | null;
}

export interface WrongAnswerSearchResult {
  kind: 'wrong_answer';
  id: string;
  question_text: string;
  topic_tag: string | null;
}

export type SearchResult = TopicSearchResult | QuestionSearchResult | WrongAnswerSearchResult;

export interface SearchResults {
  topics: TopicSearchResult[];
  questions: QuestionSearchResult[];
  wrongAnswers: WrongAnswerSearchResult[];
}

const EMPTY_RESULTS: SearchResults = { topics: [], questions: [], wrongAnswers: [] };
const LIMIT = 5;

/** topics / question_bank / wrong_answers 3개 테이블에서 실시간 ilike 검색 (레일 UI 통합 검색바용). */
export async function searchAll(term: string, userId: string | null): Promise<SearchResults> {
  const q = term.trim();
  if (q.length < 2) return EMPTY_RESULTS;
  const pattern = `%${q}%`;

  const [topicsRes, questionsRes, wrongRes] = await Promise.all([
    supabase
      .from('topics')
      .select('topic_id, topic_name, category')
      .or(`topic_name.ilike.${pattern},category.ilike.${pattern}`)
      .limit(LIMIT),
    supabase
      .from('question_bank')
      .select('id, question_text, topic_id')
      .ilike('question_text', pattern)
      .eq('is_banned', false)
      .limit(LIMIT),
    userId
      ? supabase
          .from('wrong_answers')
          .select('id, question_text, topic_tag')
          .eq('user_id', userId)
          .ilike('question_text', pattern)
          .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    topics: ((topicsRes.data ?? []) as { topic_id: string; topic_name: string; category: string | null }[])
      .map((r) => ({ kind: 'topic' as const, ...r })),
    questions: ((questionsRes.data ?? []) as { id: string; question_text: string; topic_id: string | null }[])
      .map((r) => ({ kind: 'question' as const, ...r })),
    wrongAnswers: ((wrongRes.data ?? []) as { id: string; question_text: string; topic_tag: string | null }[])
      .map((r) => ({ kind: 'wrong_answer' as const, ...r })),
  };
}
