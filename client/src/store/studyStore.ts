import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SRCard, DEFAULT_SR_CARD, updateCard, isDue, getAccuracy } from '../lib/srs';
import { getProgress, upsertProgress, saveQuizLog, updateTodaySession } from '../lib/db';

// ── Types ─────────────────────────────────────────────────────
interface ServerRow {
  topic_id: string;
  interval: number;
  next_review: string;
  streak: number;
  attempts: number;
  correct: number;
}

export interface QuizLogPayload {
  topicId: string;
  topicLabel: string;
  question: string;
  options: string[];
  correct: boolean;
  selected: number;
  answer: number;
  elapsedSeconds?: number | null;
}

interface StudyStore {
  // ── persisted state ──
  srsCards: Record<string, SRCard>;
  currentTopicId: string | null;
  expandedAreas: Record<string, boolean>;

  // ── runtime state (not persisted) ──
  userId: string | null;
  syncStatus: 'idle' | 'syncing' | 'ready' | 'offline';

  // ── actions ──
  setCurrentTopic: (id: string | null) => void;
  toggleArea: (areaId: string) => void;
  setAreaExpanded: (areaId: string, expanded: boolean) => void;
  getCard: (topicId: string) => SRCard;
  getDueTopics: () => string[];
  getDueCount: () => number;
  getWeakTopics: (threshold?: number) => string[];

  // SRS update (local + server sync)
  updateSRSCard: (topicId: string, correct: boolean) => void;

  // Quiz answer = update SRS + save log + update session (all at once)
  recordAnswer: (topicId: string, correct: boolean, log: QuizLogPayload) => void;

  // Server sync
  initStore: (uid: string) => Promise<void>;
  resetCard: (topicId: string) => void;
}

// ── Merge local cards with server rows ────────────────────────
function mergeCards(
  local: Record<string, SRCard>,
  rows: ServerRow[],
): Record<string, SRCard> {
  const merged = { ...local };
  for (const r of rows) {
    const serverCard: SRCard = {
      interval: r.interval,
      nextReview: new Date(r.next_review).getTime(),
      streak: r.streak,
      attempts: r.attempts,
      correct: r.correct,
    };
    const loc = local[r.topic_id];
    // server wins if it has equal or more attempts
    if (!loc || serverCard.attempts >= loc.attempts) {
      merged[r.topic_id] = serverCard;
    }
  }
  return merged;
}

// ── fire-and-forget: sync single card to Supabase ─────────────
function bgSync(userId: string, topicId: string, card: SRCard) {
  upsertProgress(userId, {
    topicId,
    interval: card.interval,
    nextReview: card.nextReview,
    streak: card.streak,
    attempts: card.attempts,
    correct: card.correct,
  }).catch(() => {/* offline — localStorage still has the data */});
}

// ── Store ─────────────────────────────────────────────────────
const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      srsCards: {},
      currentTopicId: null,
      expandedAreas: {},
      userId: null,
      syncStatus: 'idle' as const,

      setCurrentTopic: (id) => set({ currentTopicId: id }),

      toggleArea: (areaId) => {
        const expanded = get().expandedAreas;
        set({ expandedAreas: { ...expanded, [areaId]: !expanded[areaId] } });
      },

      setAreaExpanded: (areaId, expanded) =>
        set((s) => ({ expandedAreas: { ...s.expandedAreas, [areaId]: expanded } })),

      getCard: (topicId) => get().srsCards[topicId] ?? DEFAULT_SR_CARD,

      getDueTopics: () =>
        Object.entries(get().srsCards)
          .filter(([, c]) => isDue(c))
          .map(([id]) => id),

      getDueCount: () => get().getDueTopics().length,

      getWeakTopics: (threshold = 60) =>
        Object.entries(get().srsCards)
          .filter(([, c]) => {
            const acc = getAccuracy(c);
            return acc >= 0 && acc < threshold;
          })
          .map(([id]) => id),

      // ── updateSRSCard ────────────────────────────────────────
      updateSRSCard: (topicId, correct) => {
        const cards = get().srsCards;
        // Spread DEFAULT first so any field missing from a stale persisted
        // card gets backfilled (prevents Supabase 23502 on upsert).
        const card: SRCard = { ...DEFAULT_SR_CARD, ...(cards[topicId] ?? {}) };
        const updated = updateCard(card, correct);
        set({ srsCards: { ...cards, [topicId]: updated } });

        const uid = get().userId;
        if (uid) bgSync(uid, topicId, updated);
      },

      // ── recordAnswer — full pipeline ─────────────────────────
      recordAnswer: (topicId, correct, log) => {
        // 1. Local SRS update
        const cards = get().srsCards;
        const card: SRCard = { ...DEFAULT_SR_CARD, ...(cards[topicId] ?? {}) };
        const updated = updateCard(card, correct);
        set({ srsCards: { ...cards, [topicId]: updated } });

        // 2. Background server sync (fire-and-forget, parallel)
        const uid = get().userId;
        if (uid) {
          bgSync(uid, topicId, updated);
          saveQuizLog(uid, log).catch(() => {});
          updateTodaySession(uid, correct).catch(() => {});
        }
      },

      // ── initStore — called after login ───────────────────────
      initStore: async (uid) => {
        set({ userId: uid, syncStatus: 'syncing' });
        try {
          const rows = await getProgress(uid);
          const local = get().srsCards;
          const merged = mergeCards(local, rows as ServerRow[]);
          set({ srsCards: merged, syncStatus: 'ready' });

          // Sync local-only cards to server
          const serverIds = new Set((rows as ServerRow[]).map((r) => r.topic_id));
          for (const [topicId, card] of Object.entries(local)) {
            if (!serverIds.has(topicId) && card.attempts > 0) {
              bgSync(uid, topicId, card);
            }
          }
        } catch {
          set({ syncStatus: 'offline' });
        }
      },

      resetCard: (topicId) => {
        const cards = { ...get().srsCards };
        delete cards[topicId];
        set({ srsCards: cards });
      },
    }),
    {
      name: 'far_srs_v1',
      partialize: (s) => ({
        srsCards: s.srsCards,
        currentTopicId: s.currentTopicId,
        expandedAreas: s.expandedAreas,
      }),
    },
  ),
);

export default useStudyStore;
