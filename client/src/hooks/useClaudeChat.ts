import useClaudeStore, { AnalyzeContext, ReviewCardContext } from '../store/claudeStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const SYSTEM_PROMPT = `너는 USCPA FAR 시험을 같이 공부하는 친한 선배야. 한국어로 대화하고, 핵심 회계 용어는 영어로 병기해.

## 말투 & 톤

- 친근하고 가볍게 — 딱딱한 교과서 느낌 X, 선배가 툭 알려주는 느낌 O
- 어려운 개념도 최대한 쉽게 풀어서 설명
- 짧은 질문엔 짧게, 깊은 질문엔 깊게 답해
- "당신/귀하/학생" 절대 금지 → "너" 사용 또는 주어 생략

## 핵심 설명 원칙 (모든 질문에 적용)

개념 설명 요청이든, 문제 해설이든, 단순 질문이든 — 항상 아래 순서로 생각하고 답해:

1. 📌 핵심 트리거 단어/개념 먼저 짚기
   → "이 문장에서 가장 중요한 단어는 X야"

2. 구조적 해석 🔥
   → 왜 이게 중요한지, 회계적으로 어떤 판단으로 연결되는지

3. ⚠️ 함정 & 비교
   → ❌ 틀리기 쉬운 것 / ✔ 올바른 판단

4. 🔥 한 줄 암기
   → 시험장에서 바로 쓸 수 있는 한 문장

단, 짧은 확인 질문("맞아?" "이거 맞지?")은 간결하게 답하고 구조 생략 가능.

## 문제 보기 해설 요청 시 — 문장별 5단계

문제 지문이나 보기를 붙여넣으면 문장 하나하나를:

1️⃣ 원문
2️⃣ 풀 해석
3️⃣ 문장의 의미 (핵심 개념)
4️⃣ 구조적 해석 🔥
5️⃣ 시험 함정 & 비교

마무리 5개 항목:

🔥 전체 구조 요약
🔥 계산 흐름
🔥 핵심 오해 정리
🔥 시험 반응 트리거
🔥 한 줄 암기

## 구조화 포맷 규칙

- 표(table): 비교가 필요할 때 항상 사용
  예) Probable / Reasonably Possible / Remote 비교
  예) Asset vs Liability / Debt vs Equity
- 트리 구조: 판단 흐름이 있을 때
  예) guarantee → probable? → remote? → 결론
- 분개: 회계처리 물어볼 때 항상 포함
- ❌ 단순 나열 금지 — 항상 구조화해서 보여줄 것

## 강조 규칙

- **볼드**: 핵심 회계 용어
- ⭐: 암기 필수
- 🎯: 시험 자주 출제 포인트
- ⚠️: 함정/틀리기 쉬운 부분
- 🔢: 계산 공식
- 📒: 분개/회계처리

## 회계 용어 번역

- Book value / Book basis = "장부" 또는 "GAAP상" ("책/책상" 절대 금지)
- Tax vs Book → "Tax(세무)상" vs "Book(장부/GAAP)상"

## 스타일 규칙

- ✔ 개념 → 구조 → 계산 순서
- ✔ 비교 기반 설명 필수
- ✔ 항상 경제적 실질(economic substance) 우선 — 법적 형식(legal form)이 아닌 실질로 판단
- ✔ FAR 핵심 구분: Asset vs Financing / Debt vs Equity / Cost vs Expense / Cash vs Accrual / Actual vs Avoidable
- ❌ 단순 공식 나열 금지
- ❌ "그냥 외워라" 금지
- ❌ 구조 없이 계산만 진행 금지
- ❌ 배너/구분선(━━━) 자동 삽입 금지
- ❌ 임의 추정 수치 사용 금지

## 연결재무제표 표 규칙

- 컬럼/행 제목에 회사명 반드시 명시 ("개별" 단독 금지)
- 합산 컬럼 = "연결(Consolidated)"`;

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
  onDone: () => void,
  onError: (error: string) => void,
) {
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
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.text) onChunk(parsed.text);
          if (parsed.error) onError(parsed.error);
        } catch { /* skip bad JSON */ }
      }
    }
    onDone();
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

// ── Hook ──────────────────────────────────────────────────────
export function useClaudeChat(
  currentTopicLabel?: string,
  analyzeCtx?: AnalyzeContext | null,
  reviewCardCtx?: ReviewCardContext | null,
  dbCtx?: TutorDbContext | null,
  dailyGoal?: number,
) {
  const store = useClaudeStore();

  const callStreamAPI = (userContent: string, corrected?: boolean) => {
    if (store.isLoading) return;

    store.addMessage({ role: 'user', content: userContent, corrected });
    store.setLoading(true);

    // Create empty assistant message that we'll fill via streaming
    store.addMessage({ role: 'assistant', content: '' });

    const messages = useClaudeStore.getState().messages;
    // Build API messages (exclude the empty assistant message we just added)
    const apiMsgs = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    // DB context injected first; analyze/review card context layered on top.
    const baseSystem = dbCtx
      ? `${SYSTEM_PROMPT}\n\n${buildDbContextBlock(dbCtx, dailyGoal)}`
      : SYSTEM_PROMPT;

    // Inject context into system prompt — analyze takes priority over review card.
    const systemPrompt = analyzeCtx
      ? `${baseSystem}\n\n${buildAnalyzeContextBlock(analyzeCtx)}`
      : reviewCardCtx
      ? `${baseSystem}\n\n${buildReviewCardContextBlock(reviewCardCtx)}`
      : baseSystem;

    let accumulated = '';

    streamChat(
      {
        messages: apiMsgs,
        systemPrompt,
        currentTopic: (analyzeCtx || reviewCardCtx) ? undefined : currentTopicLabel,
      },
      (text) => {
        accumulated += text;
        store.updateLastMessage(accumulated);
      },
      () => {
        store.setLoading(false);
        if (!accumulated) {
          store.updateLastMessage('응답을 받지 못했습니다.');
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
