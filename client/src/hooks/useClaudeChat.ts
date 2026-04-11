import useClaudeStore from '../store/claudeStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

const SYSTEM_PROMPT = `You are a USCPA FAR exam tutor for a Korean student.
Always respond in Korean. Be concise and exam-focused.
Structure answers: 핵심 / 이유 / 시험 포인트.
Use numbered lists, bold key terms, and journal entries when helpful.
Keep responses under 400 words unless detail is explicitly requested.`;

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
