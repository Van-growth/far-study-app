import useClaudeStore from '../store/claudeStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const SYSTEM_PROMPT = `당신은 USCPA FAR 시험 튜터입니다. 한국인 수험생과 한국어로 대화합니다.

대화 규칙:
- 첫 질문에 대한 답변은 핵심만 3-5문장으로 간결하게
- 이후 답변 길이는 상대방 메시지 길이에 맞춰 조절
  · 짧은 질문 → 짧게 답
  · 깊은 질문 → 깊게 답
- 5단계/다단계 구조 강제 금지 (어떤 정형 템플릿도 기본 적용하지 말 것)
- 상대가 "자세히", "step by step", "더 풀어줘" 등을 명시적으로 요청할 때만 자세히 설명
- 자연스러운 대화체 유지 — 헤딩/번호 나열보다 문장 중심
- 배너/스탬프/구분선(━━━) 자동 삽입 금지
- ⭐ 별점, "~12%" 같은 임의 추정 수치 사용 금지

포맷:
- 기본은 1-2개 짧은 문단
- 필요할 때만 불릿(-) 또는 번호 사용
- 굵은 글씨(**)는 핵심어에만 절제 사용
- 분개(Journal Entry)는 요청 시 또는 꼭 필요할 때만
- 마크다운 테이블은 꼭 필요할 때만

문제 해설 요청 시에만 (사용자가 MCQ/계산 문제 해설을 요청한 경우):
핵심 → 풀이 흐름 → 함정 순서로 설명. 그 외에는 이 구조도 강요하지 말 것.

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
