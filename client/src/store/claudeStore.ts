import { create } from 'zustand';
import type { ExampleQuestion } from '../lib/db';

export interface ActiveBankQuestion {
  questionId: string;
  topicId: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  contextBackground: string | null;
  contextTrigger: string | null;
  ruleTitle: string | null;
  ruleItems: string[] | null;
  trigger: string | null;
  trap: string | null;
  speed: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'up' | 'down' | null;
  corrected?: boolean;
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

export interface ReviewCardContext {
  topicId: string | null;
  topicLabel: string | null;
  topicTags: string[];
  concepts: string[];
  trapPattern: string | null;
  questionText: string | null;
  correctAnswer: string | null;
  extractionId: string | null;
  exampleQuestion: ExampleQuestion | null;
}

export interface CurrentTBSPattern {
  tbs_id: string;
  pattern_name: string;
  topic_group: string;
  related_topic_ids: string[];
  question_text: string;
  answer_columns: { col: string; label: string; type: string; auto?: boolean }[];
  exhibits: {
    exhibit_id: number;
    label: string;
    items: { row: string; en: string; ko: string }[];
  }[];
  solve_steps: { step: number; en: string; ko: string; detail: string }[];
  rules: { tx_type: string; en_rule: string; columns: string[]; ko_trap: string }[];
  answer_table: {
    rows: ({ label: string } & Record<string, number | null | string>)[];
  };
}

const MAX_MESSAGES = 20;

export interface HarryContext {
  context_type: 'tbs' | 'mcq' | 'sprint' | 'concept' | 'general';
  context_id: string | null;
  context_name: string | null;
}

export const PANEL_WIDTH_MIN = 360;
export const PANEL_WIDTH_MAX = 800;
export const PANEL_WIDTH_DEFAULT = 480;
const PANEL_WIDTH_KEY = 'harry_panel_width';

function loadSavedPanelWidth(): number {
  try {
    const v = localStorage.getItem(PANEL_WIDTH_KEY);
    if (v) return Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, parseInt(v, 10)));
  } catch { /* ignore */ }
  return PANEL_WIDTH_DEFAULT;
}

export type HarryMode = 'haiku' | 'sonnet5';

interface ClaudeStore {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  pendingQuiz: PendingQuizContext | null;
  analyzeContext: AnalyzeContext | null;
  reviewCardContext: ReviewCardContext | null;
  activeBankQuestion: ActiveBankQuestion | null;
  lastTtsScript: string | null;
  pendingAutoMessage: string | null;
  currentTBSPattern: CurrentTBSPattern | null;
  harryContext: HarryContext | null;
  harryConversationId: string | null;
  panelWidth: number;
  mode: HarryMode;
  lastModelUsed: string | null;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string;
  updateLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setPendingQuiz: (ctx: PendingQuizContext | null) => void;
  setAnalyzeContext: (ctx: AnalyzeContext | null) => void;
  setReviewCardContext: (ctx: ReviewCardContext | null) => void;
  setActiveBankQuestion: (q: ActiveBankQuestion | null) => void;
  setMessageFeedback: (id: string, fb: 'up' | 'down' | null) => void;
  setLastTtsScript: (s: string | null) => void;
  setPendingAutoMessage: (msg: string | null) => void;
  setCurrentTBSPattern: (p: CurrentTBSPattern | null) => void;
  setHarryContext: (ctx: HarryContext | null) => void;
  setHarryConversationId: (id: string | null) => void;
  setMessages: (msgs: Message[]) => void;
  setPanelWidth: (w: number) => void;
  setMode: (m: HarryMode) => void;
  setLastModelUsed: (model: string | null) => void;
}

const useClaudeStore = create<ClaudeStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  pendingQuiz: null,
  analyzeContext: null,
  reviewCardContext: null,
  activeBankQuestion: null,
  lastTtsScript: null,
  pendingAutoMessage: null,
  currentTBSPattern: null,
  harryContext: null,
  harryConversationId: null,
  panelWidth: loadSavedPanelWidth(),
  mode: 'haiku',
  lastModelUsed: null,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  setMode: (m) => set({ mode: m }),
  setLastModelUsed: (model) => set({ lastModelUsed: model }),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  setPanelWidth: (w) => {
    const clamped = Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, w));
    try { localStorage.setItem(PANEL_WIDTH_KEY, String(clamped)); } catch { /* ignore */ }
    set({ panelWidth: clamped });
  },
  setPendingQuiz: (ctx) => set({ pendingQuiz: ctx }),
  setAnalyzeContext: (ctx) => set({ analyzeContext: ctx }),
  setReviewCardContext: (ctx) => set({ reviewCardContext: ctx }),
  setActiveBankQuestion: (q) => set({ activeBankQuestion: q }),
  setLastTtsScript: (s) => set({ lastTtsScript: s }),
  setPendingAutoMessage: (msg) => set({ pendingAutoMessage: msg }),
  setCurrentTBSPattern: (p) => set({ currentTBSPattern: p }),
  setHarryContext: (ctx) => set({ harryContext: ctx }),
  setHarryConversationId: (id) => set({ harryConversationId: id }),
  setMessages: (msgs) => set({ messages: msgs }),
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
