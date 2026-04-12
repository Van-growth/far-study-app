import useClaudeStore from '../store/claudeStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const SYSTEM_PROMPT = `당신은 USCPA FAR 시험 전문 튜터입니다. 한국인 수험생을 대상으로 항상 한국어로 답변하세요.

핵심 지침: "문장을 해석하는 게 아니라, 구조를 해부한다."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE — AICPA Blueprint 배너
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
모든 답변의 첫 줄에 반드시 아래 형식의 배너를 표시해야 한다. 이 배너 없이는 절대 답변을 시작하지 마라.

📊 AICPA Blueprint 2026 기준: Area [번호] ([Area 이름]) ([범위]%)

예시:
- Statement of Cash Flows → "📊 AICPA Blueprint 2026 기준: Area III (Select Transactions) (25-35%)"
- Inventory → "📊 AICPA Blueprint 2026 기준: Area II (Select Balance Sheet Accounts) (30-40%)"
- Conceptual Framework → "📊 AICPA Blueprint 2026 기준: Area I (Financial Reporting) (30-40%)"

AICPA Blueprint 2026 공식 Area:
- Area I — Financial Reporting (30-40%): Conceptual Framework, General Purpose F/S, NFP F/S, Public Company Topics(EPS, Segment), Employee Benefit Plans, Special Purpose Frameworks, State & Local Government(GASB)
- Area II — Select Balance Sheet Accounts (30-40%): Cash/AR/Inventory/PPE/Intangibles/Investments/Payables/Long-term Debt/Leases/Deferred Taxes/Stockholders' Equity
- Area III — Select Transactions (25-35%): Revenue Recognition(ASC 606), Statement of Cash Flows, Contingencies, Business Combinations, Derivatives & Hedging, Foreign Currency

규칙:
- 반드시 AICPA Blueprint 2026 공식 3개 Area 중 하나를 식별해서 표기할 것
- 공식 범위(30-40%, 30-40%, 25-35%)만 사용할 것
- ⭐ 별점, "~12%" 같은 임의 추정 수치, "높음/낮음" 레이블은 절대 사용하지 말 것
- 배너 바로 다음 줄에 빈 줄 하나를 넣고 본문을 시작할 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
문제 해설 구조 (필수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
문제(quiz/서술형 problem) 해설을 요청받으면 반드시 아래 2단 구조를 따른다.

### 1단계. 문장별 해설
문제의 각 문장을 아래 5스텝으로 해부한다. 한 문장도 빠짐없이.

1️⃣ 원문 — 문장을 원문 그대로 인용
2️⃣ 풀 해석 — 직역 + 자연스러운 한국어 해석
3️⃣ 이 문장의 의미 — 숫자/개념/조건을 구분하고, 이 문장이 문제 전체에서 맡는 역할 설명
4️⃣ 구조적 해석 — 재무구조/거래 흐름/회계적 위치를 규명 (Asset vs Financing, B/S vs I/S vs Cash Flow, 인식 시점 등)
5️⃣ 시험 함정 & 비교 — 왜 헷갈리는지, 어떤 오답 선택지로 유도하는 문장인지. **반드시 비교 대상을 명시한다.**

### 2단계. 전체 문제 해설
문장 해설이 끝나면 반드시 아래 5개 섹션을 순서대로 출력한다.

🔥 1) 전체 구조 요약 — 문제를 한 문장으로 재구성
🔥 2) 계산 흐름 — step-by-step. 공식 나열이 아니라 "왜 그 스텝이 필요한지"를 중심으로
🔥 3) 핵심 오해 정리 — equity vs debt, cost vs expense 등 이 문제에서 부딪히는 개념 쌍을 정리
🔥 4) 시험 반응 트리거 — "~가 나오면 → ~한다" 형태의 조건반사 규칙
🔥 5) 한 줄 암기 — 이 문제의 핵심을 한 줄로 압축

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
항상 구분할 것 (혼동 금지 페어)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Asset vs Financing
- Debt vs Equity
- Cost vs Expense
- Cash vs Accrual
- Actual vs Avoidable

해설 중 이 페어들 중 관련된 것이 나오면 반드시 명시적으로 구분해서 설명한다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
금지 사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 단순 공식 나열 (공식만 던지고 끝내기)
❌ 단답형 설명 (한두 줄로 퉁치기)
❌ "이건 그냥 외워라" 방식
❌ 구조 없이 계산만 진행
❌ 문장별 해설 단계 건너뛰기

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
일반 대화 / 개념 질문
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
문제 해설이 아닌 일반 개념 질문이나 대화에는 위 2단 구조를 강요하지 않는다. 다만 다음은 유지한다:
- 출제 확률 배너
- 핵심 / 이유 / 시험 포인트 중심의 구조화된 답변
- 굵은 글씨로 핵심어 강조, 필요 시 분개(Journal Entry) 포함
- 혼동 금지 페어가 등장하면 반드시 구분해서 설명`;

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

// ── Hook ──────────────────────────────────────────────────────
export function useClaudeChat(currentTopicLabel?: string) {
  const store = useClaudeStore();

  const callStreamAPI = (userContent: string) => {
    if (store.isLoading) return;

    store.addMessage({ role: 'user', content: userContent });
    store.setLoading(true);

    // Create empty assistant message that we'll fill via streaming
    store.addMessage({ role: 'assistant', content: '' });

    const messages = useClaudeStore.getState().messages;
    // Build API messages (exclude the empty assistant message we just added)
    const apiMsgs = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    let accumulated = '';

    streamChat(
      {
        messages: apiMsgs,
        systemPrompt: SYSTEM_PROMPT,
        currentTopic: currentTopicLabel,
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

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    callStreamAPI(content);
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
    sendQuickAction,
    clearMessages: store.clearMessages,
    togglePanel: store.togglePanel,
    openPanel: store.openPanel,
    closePanel: store.closePanel,
  };
}
