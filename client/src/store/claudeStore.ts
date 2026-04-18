import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'up' | 'down' | null;
}

export interface PendingQuizContext {
  q: string;
  opts: [string, string, string, string];
  ans: number;
  selected: number;
  topicLabel: string;
}

export interface AnalyzeContext {
  questionText: string;
  userAnswer: string | null;
  correctAnswer: string | null;
  topicId: string | null;
  topicLabel: string | null;
  concepts: string[];
  trapPattern: string | null;
}

const MAX_MESSAGES = 20;

interface ClaudeStore {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  pendingQuiz: PendingQuizContext | null;
  analyzeContext: AnalyzeContext | null;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setPendingQuiz: (ctx: PendingQuizContext | null) => void;
  setAnalyzeContext: (ctx: AnalyzeContext | null) => void;
  setMessageFeedback: (id: string, fb: 'up' | 'down' | null) => void;
}

const useClaudeStore = create<ClaudeStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  pendingQuiz: null,
  analyzeContext: null,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  setPendingQuiz: (ctx) => set({ pendingQuiz: ctx }),
  setAnalyzeContext: (ctx) => set({ analyzeContext: ctx }),
  setMessageFeedback: (id, fb) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, feedback: fb } : m)),
    })),

  addMessage: (msg) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((s) => {
      const updated = [...s.messages, { ...msg, id, timestamp: Date.now() }];
      return { messages: updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated };
    });
    return id;
  },

  updateLastMessage: (content) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      return { messages: msgs };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));

export default useClaudeStore;
