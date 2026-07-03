import useClaudeStore, { AnalyzeContext, ReviewCardContext, CurrentTBSPattern } from '../store/claudeStore';
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2';
import useStudyStore from '../store/studyStore';
import { parseWrongAnswerBlock, saveWrongAnswer } from '../lib/harryWrongAnswer';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

// 정적 시스템 프롬프트(STEP 0~4 지침 + FAR 규칙)는 server/prompts/harry-system-prompt.md로 이전됨 —
// 서버가 매 요청 cache_control로 캐시 재사용. 여기서는 요청마다 바뀌는 동적 컨텍스트만 조립해서 전송한다.

const ALPHA = ['A', 'B', 'C', 'D'];

export interface TutorDbContext {
  todayStats: { knew: number; confused: number };
  weakTopics: { topicId: string; accuracy: number; attempts: number }[];
  topErrorPatterns: { name: string; count: number }[];
  recentConfusedTopics: { topicId: string; count: number }[];
}

export interface QuizContext {
  q: string;
  opts: [string, string, string, string];
  ans: number;
  selected: number;
  topicLabel: string;
}

// ── SSE stream consumer ───────────────────────────────────────
async function streamChat(
  body: object,
  onChunk: (text: string) => void,
  onDone: (model?: string) => void,
  onError: (error: string) => void,
) {
  let lastModel: string | undefined;
  try {
    const res = await fetch(`${API_URL}/api/claude/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}`);
      onDone();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') { onDone(lastModel); return; }
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string; model?: string };
          if (parsed.text) onChunk(parsed.text);
          if (parsed.error) onError(parsed.error);
          if (parsed.model) lastModel = parsed.model;
        } catch { /* skip bad JSON */ }
      }
    }
    onDone(lastModel);
  } catch {
    onError('서버에 연결할 수 없습니다. server를 실행했는지 확인하세요.');
    onDone();
  }
}

function buildDbContextBlock(ctx: TutorDbContext, dailyGoal?: number): string {
  const total = ctx.todayStats.knew + ctx.todayStats.confused;
  const lines = ['---', '[학습자 현황]', ''];
  lines.push(`오늘 풀이: ${total}개${dailyGoal ? ` / 목표: ${dailyGoal}개` : ''}`);
  if (ctx.weakTopics.length > 0) {
    lines.push(`취약 토픽 Top ${ctx.weakTopics.length}: ${ctx.weakTopics.map((t) => `${t.topicId}(${t.accuracy}%)`).join(', ')}`);
  }
  if (ctx.topErrorPatterns.length > 0) {
    lines.push(`자주 틀리는 패턴: ${ctx.topErrorPatterns.map((p) => `${p.name} ${p.count}회`).join(', ')}`);
  }
  if (ctx.recentConfusedTopics.length > 0) {
    lines.push(`최근 7일 헷갈린 토픽: ${ctx.recentConfusedTopics.map((t) => t.topicId).join(', ')}`);
  }
  lines.push('---');
  lines.push('위 데이터를 참고해서 학생의 약점에 맞게 개인화된 답변 제공. 위 수치는 참고용이며 답변에 그대로 노출하지 말 것.');
  return lines.join('\n');
}

// Builds a context block for the system prompt from the analyze page state.
function buildAnalyzeContextBlock(ctx: AnalyzeContext): string {
  const MAX_Q = 1500;
  const q = ctx.questionText.length > MAX_Q
    ? ctx.questionText.slice(0, MAX_Q) + '…(생략)'
    : ctx.questionText;
  const lines = [
    '---',
    '현재 학생이 분석 중인 문제:',
    q,
    '---',
    `정답: ${ctx.correctAnswer ?? '(미입력)'}`,
    `학생의 답: ${ctx.userAnswer ?? '(미입력)'}`,
    `모듈: ${ctx.topicId ?? '(미특정)'}${ctx.topicLabel ? ` · ${ctx.topicLabel}` : ''}`,
  ];
  if (ctx.concepts.length > 0) lines.push(`추출된 개념: ${ctx.concepts.slice(0, 6).join(', ')}`);
  if (ctx.trapPattern) lines.push(`함정 패턴: ${ctx.trapPattern}`);
  lines.push('---');
  lines.push('이 문제를 기반으로 학생의 질문에 답해줘. 개념 설명은 한국어로, 핵심 트리거 중심으로. AI가 임의로 다른 문제를 상상하지 말 것.');
  return lines.join('\n');
}

function buildReviewCardContextBlock(ctx: ReviewCardContext): string {
  const lines = [
    '---',
    '학생이 현재 복습 중인 개념 카드:',
    `모듈: ${ctx.topicId ?? '(미특정)'}${ctx.topicLabel ? ` · ${ctx.topicLabel}` : ''}`,
  ];
  if (ctx.topicTags.length > 0) lines.push(`토픽: ${ctx.topicTags.join(', ')}`);
  if (ctx.concepts.length > 0) lines.push(`핵심 개념: ${ctx.concepts.slice(0, 8).join(', ')}`);
  if (ctx.trapPattern) lines.push(`함정 패턴: ${ctx.trapPattern}`);
  if (ctx.questionText) {
    lines.push('---');
    lines.push('예시 문제:');
    lines.push(ctx.questionText);
    if (ctx.correctAnswer) lines.push(`정답: ${ctx.correctAnswer}`);
  }
  lines.push('---');
  lines.push('이 개념 카드와 예시 문제를 기반으로 학생의 질문에 답해줘. 한국어로, 핵심 트리거 중심으로. AI가 임의로 다른 내용을 상상하지 말 것.');
  return lines.join('\n');
}

function buildTBSContextBlock(ctx: CurrentTBSPattern): string {
  const lines: string[] = [
    '---',
    `[TBS: ${ctx.pattern_name} (${ctx.tbs_id})]`,
    '',
    // Question text — core context
    `Question: ${ctx.question_text}`,
  ];

  // Solve steps only (lightweight: en + ko, skip detail)
  if (ctx.solve_steps.length > 0) {
    lines.push('');
    lines.push('Solve steps:');
    ctx.solve_steps.forEach((s) => {
      lines.push(`${s.step}. ${s.en} — ${s.ko}`);
    });
  }

  lines.push('');
  lines.push("When the user says 'show me', generate an SVG using the actual numbers from this problem.");
  lines.push('---');

  return lines.join('\n');
}

// ── Filtered SSOT context ─────────────────────────────────────
type FilterMode = 'context' | 'keyword' | 'none';

function formatCards(cards: TopicCard[]): string {
  return cards.map((t) =>
    `[${t.topic_id}] ${t.card_name ?? t.topic_name ?? ''}\nRULE: ${t.rule}${t.trigger ? `\nTRIGGER: ${t.trigger}` : ''}${t.trap ? `\nTRAP: ${t.trap}` : ''}${t.one_sentence ? `\nKEY: ${t.one_sentence}` : ''}`
  ).join('\n\n');
}

function buildFilteredSsotBlock(
  analyzeCtx?: AnalyzeContext | null,
  reviewCardCtx?: ReviewCardContext | null,
  tbsCtx?: CurrentTBSPattern | null,
  userInput?: string,
): { block: string; filterMode: FilterMode; matchedCards: number } {
  // ── Path A: explicit context (topic_id known) ──────────────
  const candidateIds = [
    analyzeCtx?.topicId,
    reviewCardCtx?.topicId,
    ...(tbsCtx?.related_topic_ids ?? []),
  ].filter((id): id is string => !!id);

  if (candidateIds.length > 0) {
    const seedCards = PROFESSOR_SSOT_V2.filter((c) => candidateIds.includes(c.topic_id));
    const chapterIds = new Set(seedCards.map((c) => c.chapter_id).filter((id): id is string => !!id));
    const filtered = chapterIds.size > 0
      ? PROFESSOR_SSOT_V2.filter((c) => c.chapter_id && chapterIds.has(c.chapter_id))
      : seedCards.slice(0, 5);

    if (filtered.length > 0) {
      const label = [...chapterIds].join(', ') || (candidateIds[0] ?? '관련 토픽');
      return {
        block: `\n\n## FAR Topic Reference (${filtered.length} cards — ${label})\n\n${formatCards(filtered)}`,
        filterMode: 'context',
        matchedCards: filtered.length,
      };
    }
  }

  // ── Path B: keyword matching on user input ─────────────────
  if (userInput) {
    const inputLower = userInput.toLowerCase();
    const scored = PROFESSOR_SSOT_V2
      .map((card) => {
        const keywords = (card.trigger ?? '')
          .split('|')
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 2);
        const score = keywords.filter((kw) => inputLower.includes(kw)).length;
        return { card, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const matched = scored.slice(0, 5).map((r) => r.card);
      return {
        block: `\n\n## FAR Topic Reference (${matched.length} cards — keyword match)\n\n${formatCards(matched)}`,
        filterMode: 'keyword',
        matchedCards: matched.length,
      };
    }
  }

  // ── Path C: no match ───────────────────────────────────────
  return {
    block: '\n\n[FAR 개념 참조]\n현재 관련 개념 카드를 찾지 못했습니다. Harry는 자체 지식으로 답변합니다.',
    filterMode: 'none',
    matchedCards: 0,
  };
}

// ── Hook ──────────────────────────────────────────────────────
export function useClaudeChat(
  currentTopicLabel?: string,
  analyzeCtx?: AnalyzeContext | null,
  reviewCardCtx?: ReviewCardContext | null,
  dbCtx?: TutorDbContext | null,
  dailyGoal?: number,
  tbsCtx?: CurrentTBSPattern | null,
) {
  const store = useClaudeStore();
  const userId = useStudyStore((s) => s.userId);

  const callStreamAPI = (userContent: string, corrected?: boolean) => {
    if (store.isLoading) return;

    store.addMessage({ role: 'user', content: userContent, corrected });
    store.setLoading(true);

    // Create empty assistant message that we'll fill via streaming
    store.addMessage({ role: 'assistant', content: '' });

    const messages = useClaudeStore.getState().messages;
    // Build API messages (exclude the empty assistant message we just added)
    const apiMsgs = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    // DB 통계 컨텍스트 (있으면 맨 앞)
    const baseDynamic = dbCtx ? buildDbContextBlock(dbCtx, dailyGoal) : '';

    // Inject filtered SSOT — context first, keyword fallback, none last
    const { block: ssotBlock, filterMode, matchedCards } = buildFilteredSsotBlock(
      analyzeCtx, reviewCardCtx, tbsCtx, userContent,
    );
    const withSsot = `${baseDynamic}${ssotBlock}`;

    // Inject context — analyze takes priority over review card.
    const withContext = analyzeCtx
      ? `${withSsot}\n\n${buildAnalyzeContextBlock(analyzeCtx)}`
      : reviewCardCtx
      ? `${withSsot}\n\n${buildReviewCardContextBlock(reviewCardCtx)}`
      : withSsot;

    const dynamicContext = tbsCtx
      ? `${withContext}\n\n${buildTBSContextBlock(tbsCtx)}`
      : withContext;

    let accumulated = '';

    streamChat(
      {
        messages: apiMsgs,
        dynamicContext,
        currentTopic: (analyzeCtx || reviewCardCtx) ? undefined : currentTopicLabel,
        filterMode,
        matchedCards,
        mode: store.mode,
      },
      (text) => {
        accumulated += text;
        store.updateLastMessage(accumulated);
      },
      (model) => {
        store.setLoading(false);
        store.setLastModelUsed(model ?? null);
        if (!accumulated) {
          store.updateLastMessage('응답을 받지 못했습니다.');
          return;
        }
        const parsed = parseWrongAnswerBlock(accumulated);
        if (parsed && userId) {
          saveWrongAnswer(parsed, userId, model ?? null).catch((e) =>
            console.warn('[harry] wrong_answers 자동저장 실패:', e),
          );
        }
      },
      (error) => {
        store.updateLastMessage(`❌ ${error}`);
        store.setLoading(false);
      },
    );
  };

  const sendMessage = (content: string, corrected?: boolean) => {
    if (!content.trim()) return;
    callStreamAPI(content, corrected);
  };

  const sendQuizExplanation = (ctx: QuizContext) => {
    store.openPanel();
    const optLines = ctx.opts.map((o, i) => `${ALPHA[i]}. ${o}`).join(' / ');
    const isCorrect = ctx.ans === ctx.selected;
    const prompt = `다음 FAR 문제를 해설해줘.

문제: ${ctx.q}
선택지: ${optLines}
정답: ${ALPHA[ctx.ans]}. ${ctx.opts[ctx.ans]}
내가 선택한 답: ${ALPHA[ctx.selected]}. ${ctx.opts[ctx.selected]}${isCorrect ? ' ✅' : ' ❌'}

형식:
각 문장마다 5단계 해설 (1️⃣원문 → 2️⃣풀 해석 → 3️⃣문장의 의미 → 4️⃣구조적 해석🔥 → 5️⃣시험 함정 & 비교)
마무리: 🔥전체 구조 요약 / 🔥계산 흐름 / 🔥핵심 오해 정리 / 🔥시험 반응 트리거 / 🔥한 줄 암기`;

    callStreamAPI(prompt);
  };

  const sendStarter = (kind: 'explain' | 'concept' | 'critique', ctx: QuizContext) => {
    const optLines = ctx.opts.map((o, i) => `${ALPHA[i]}. ${o}`).join(' / ');
    const isCorrect = ctx.ans === ctx.selected;
    const base = `문제: ${ctx.q}\n선택지: ${optLines}\n정답: ${ALPHA[ctx.ans]}. ${ctx.opts[ctx.ans]}\n내가 선택한 답: ${ALPHA[ctx.selected]}. ${ctx.opts[ctx.selected]}${isCorrect ? ' ✅' : ' ❌'}`;
    const prompts: Record<typeof kind, string> = {
      explain: `다음 FAR 문제를 단계별로 해설해줘.\n\n${base}\n\n형식: 핵심 한 줄 → 풀이 흐름 → 함정 포인트`,
      concept: `이 문제가 다루는 주요 개념을 정리해줘. 시험 관점에서 꼭 알아야 할 포인트 중심으로.\n\n${base}`,
      critique: `이 문제에 대해 의문점이나 이의를 제기하고 싶어. 문제의 함정/오류 가능성, 모호한 점을 짚어줘.\n\n${base}`,
    };
    callStreamAPI(prompts[kind]);
  };

  const sendQuickAction = (action: string) => {
    const topic = currentTopicLabel ?? '현재 토픽';
    const prompts: Record<string, string> = {
      summary: `"${topic}"의 핵심 개념을 FAR 시험 관점에서 5가지로 요약해줘.`,
      trap: `"${topic}"에서 FAR 시험에 자주 나오는 함정과 주의할 점을 예시와 함께 알려줘.`,
      example: `"${topic}"을 처음 배우는 사람도 이해할 수 있게 쉬운 숫자 예시와 분개로 설명해줘.`,
    };
    callStreamAPI(prompts[action] ?? `"${topic}"에 대해 설명해줘.`);
  };

  return {
    messages: store.messages,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    sendMessage,
    sendQuizExplanation,
    sendStarter,
    sendQuickAction,
    clearMessages: store.clearMessages,
    togglePanel: store.togglePanel,
    openPanel: store.openPanel,
    closePanel: store.closePanel,
  };
}
