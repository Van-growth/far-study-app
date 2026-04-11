import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const MAX_MESSAGES = 20;

interface ClaudeStore {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

const useClaudeStore = create<ClaudeStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),

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
