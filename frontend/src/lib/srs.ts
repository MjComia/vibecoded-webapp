import {
  fsrs,
  createEmptyCard,
  Rating,
  Card as FSRSCard,
  RecordLogItem,
  Grade,
} from "ts-fsrs";

const f = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
});

export type CardRating = "Again" | "Hard" | "Good" | "Easy";

export const RATING_MAP: Record<CardRating, Grade> = {
  Again: Rating.Again as Grade,
  Hard: Rating.Hard as Grade,
  Good: Rating.Good as Grade,
  Easy: Rating.Easy as Grade,
};

export function formatInterval(targetDate: Date, fromDate: Date = new Date()): string {
  const diffMs = targetDate.getTime() - fromDate.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes <= 1) return "< 1m";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1d";
  if (diffDays < 30) return `${diffDays}d`;
  const months = Math.round(diffDays / 30);
  return `${months}mo`;
}

export interface FSRSNextIntervals {
  Again: { due: Date; label: string };
  Hard: { due: Date; label: string };
  Good: { due: Date; label: string };
  Easy: { due: Date; label: string };
}

export function computeNextIntervals(card: FSRSCard, now: Date = new Date()): FSRSNextIntervals {
  const preview = f.repeat(card, now);
  return {
    Again: {
      due: preview[Rating.Again].card.due,
      label: formatInterval(preview[Rating.Again].card.due, now),
    },
    Hard: {
      due: preview[Rating.Hard].card.due,
      label: formatInterval(preview[Rating.Hard].card.due, now),
    },
    Good: {
      due: preview[Rating.Good].card.due,
      label: formatInterval(preview[Rating.Good].card.due, now),
    },
    Easy: {
      due: preview[Rating.Easy].card.due,
      label: formatInterval(preview[Rating.Easy].card.due, now),
    },
  };
}

export function applyCardReview(
  card: FSRSCard,
  rating: CardRating,
  now: Date = new Date()
): RecordLogItem {
  const grade = RATING_MAP[rating];
  const preview = f.repeat(card, now);
  return preview[grade];
}

export function createNewCard(now: Date = new Date()): FSRSCard {
  return createEmptyCard(now);
}
