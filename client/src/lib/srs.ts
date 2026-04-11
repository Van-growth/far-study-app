export const SR_INTERVALS = [1, 3, 7, 14, 30, 60]; // days

export interface SRCard {
  interval: number;    // index into SR_INTERVALS
  nextReview: number;  // timestamp (ms)
  streak: number;
  attempts: number;
  correct: number;
}

export const DEFAULT_SR_CARD: SRCard = {
  interval: 0,
  nextReview: 0,
  streak: 0,
  attempts: 0,
  correct: 0,
};

export function updateCard(card: SRCard, correct: boolean): SRCard {
  if (correct) {
    const newInterval = Math.min(card.interval + 1, SR_INTERVALS.length - 1);
    return {
      ...card,
      interval: newInterval,
      nextReview: Date.now() + SR_INTERVALS[newInterval] * 86400000,
      streak: card.streak + 1,
      attempts: card.attempts + 1,
      correct: card.correct + 1,
    };
  } else {
    return {
      ...card,
      interval: 0,
      nextReview: Date.now() + 86400000,
      streak: 0,
      attempts: card.attempts + 1,
      correct: card.correct,
    };
  }
}

export function isDue(card: SRCard): boolean {
  return card.attempts > 0 && card.nextReview <= Date.now();
}

export function getAccuracy(card: SRCard): number {
  if (card.attempts === 0) return -1;
  return Math.round((card.correct / card.attempts) * 100);
}

export function getDaysUntilReview(card: SRCard): number {
  if (card.attempts === 0) return -1;
  const diff = card.nextReview - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function getStatusColor(accuracy: number): string {
  if (accuracy < 0) return '#94a3b8'; // gray - not started
  if (accuracy >= 80) return '#22c55e'; // green
  if (accuracy >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

export function interleaveQuestions<T extends { topicId: string }>(questions: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = [...questions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Rearrange to avoid same-topic consecutively
  const result: T[] = [];
  const available = [...arr];

  while (available.length > 0) {
    const lastTopic = result.length > 0 ? result[result.length - 1].topicId : null;
    const idx = available.findIndex((q) => q.topicId !== lastTopic);

    if (idx === -1) {
      // All remaining are same topic
      result.push(...available);
      break;
    }

    result.push(available[idx]);
    available.splice(idx, 1);
  }

  return result;
}
