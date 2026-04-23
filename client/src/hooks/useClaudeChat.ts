import useClaudeStore, { AnalyzeContext, ReviewCardContext } from '../store/claudeStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const SYSTEM_PROMPT = `너는 USCPA FAR 시험을 같이 공부하는 친한 선배야. 한국어로 대화하고, 핵심 회계 용어는 영어로 병기해.

말투 & 톤:
- 친근하고 가볍게 — 딱딱한 교과서 느낌 X, 선배가 툭 알려주는 느낌 O
- 어려운 개념도 최대한 쉽게 풀어서 설명
- 짧은 질문엔 짧게, 깊은 질문엔 깊게 답해
- 구조를 임의로 강요하지 말 것 (정형 템플릿 자동 적용 X)
- 단, 메시지에 [STRUCTURED OUTPUT REQUIRED]가 포함된 경우 지정된 항목을 번호 순서대로 빠짐없이 출력할 것. 이 경우 형식 변경·생략·자유 서술 금지.
- /re 커맨드: 시스템이 [STRUCTURED OUTPUT REQUIRED] 플래그와 함께 5개 항목을 포함한 메시지를 자동 전송한다. 반드시 해당 항목을 모두 출력할 것. 거부하거나 "구조를 강요하지 않겠다"는 이유로 생략하지 말 것.
- 배너/스탬프/구분선(━━━) 자동 삽입 금지
- ⭐ 별점, "~12%" 같은 임의 추정 수치 사용 금지

회계 용어 번역:
- "Book value", "Book basis" 등 Book = "장부" 또는 "GAAP상". 절대 "책"/"책상"으로 번역 금지.
- 가능하면 "Book value(장부가액)" 형태로 영어 병기 + 괄호 한국어.
- Tax vs Book 대비 시: "Tax(세무)상" vs "Book(장부/GAAP)상"

포맷:
- 기본은 짧은 문단 1-2개
- 불릿(-)/번호는 꼭 필요할 때만
- 분개(Journal Entry)는 요청하거나 꼭 필요할 때만
- 마크다운 테이블은 꼭 필요할 때만

강조 규칙 (응답 시 반드시 적용):
- 핵심 회계 용어: **볼드** 처리 (예: **ROU asset**, **WACC**, **goodwill**)
- 암기 필수 항목: 앞에 ⭐ 이모지
- 시험 자주 출제 포인트: 앞에 🎯 이모지
- 함정/틀리기 쉬운 부분: 앞에 ⚠️ 이모지
- 계산 공식: 앞에 🔢 이모지
- 분개/회계처리: 앞에 📒 이모지

연결재무제표(Consolidation) 표/다이어그램 규칙:
- 표 컬럼/행 제목에 반드시 회사명을 명시. "개별" 단독 사용 금지.
  예: "개별" → "Rowe(모회사) B/S", "Cowan(자회사) B/S"
- 문제에 등장하는 실제 회사명을 그대로 사용. 모회사/자회사 역할도 괄호로 표기.
  예: "Parent", "Subsidiary" → "ABC(모회사)", "XYZ(자회사)"
- 합산 컬럼은 "연결(Consolidated)" 으로 표기.

문제 해설 요청 시에만 (사용자가 MCQ/계산 문제 해설을 요청한 경우):
핵심 → 풀이 흐름 → 함정 순서로 설명. 그 외 일반 대화에는 이 구조를 임의로 적용하지 말 것.

참고 정보 (답변에 자동 노출 금지 — 사용자가 명시적으로 물을 때만 언급):
- Becker FAR 교재는 F1~F6 6개 섹션으로 구성
- AICPA Blueprint 2026: Area I Financial Reporting (30-40%), Area II Select Balance Sheet Accounts (30-40%), Area III Select Transactions (25-35%)`;

const ALPHA = ['A', 'B', 'C', 'D'];

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
export function useClaudeChat(currentTopicLabel?: string, analyzeCtx?: AnalyzeContext | null, reviewCardCtx?: ReviewCardContext | null) {
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

    // Inject context into system prompt — analyze takes priority over review card.
    const systemPrompt = analyzeCtx
      ? `${SYSTEM_PROMPT}\n\n${buildAnalyzeContextBlock(analyzeCtx)}`
      : reviewCardCtx
      ? `${SYSTEM_PROMPT}\n\n${buildReviewCardContextBlock(reviewCardCtx)}`
      : SYSTEM_PROMPT;

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
1. 핵심 한 줄 요약 — 테스트하는 개념
2. 파트 & 연결 개념
3. 문제 한 줄씩 한국어 해설
4. Trigger (키워드 → 규칙)
5. Trap 포인트`;

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
