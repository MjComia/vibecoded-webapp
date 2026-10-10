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

  if (diffMinutes <= 1) return "< 1 min";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} hr`;
  if (diffDays === 1) return "1 day";
  if (diffDays < 30) return `${diffDays} days`;
  const months = Math.round(diffDays / 30);
  return `${months} mo`;
}

export interface CardNextIntervals {
  Again: { due: Date; label: string };
  Hard: { due: Date; label: string };
  Good: { due: Date; label: string };
  Easy: { due: Date; label: string };
}

export class SRSService {
  static createInitialCard(now: Date = new Date()): FSRSCard {
    return createEmptyCard(now);
  }

  static getNextIntervals(card: FSRSCard, now: Date = new Date()): CardNextIntervals {
    const schedulingCards = f.repeat(card, now);

    return {
      Again: {
        due: schedulingCards[Rating.Again].card.due,
        label: formatInterval(schedulingCards[Rating.Again].card.due, now),
      },
      Hard: {
        due: schedulingCards[Rating.Hard].card.due,
        label: formatInterval(schedulingCards[Rating.Hard].card.due, now),
      },
      Good: {
        due: schedulingCards[Rating.Good].card.due,
        label: formatInterval(schedulingCards[Rating.Good].card.due, now),
      },
      Easy: {
        due: schedulingCards[Rating.Easy].card.due,
        label: formatInterval(schedulingCards[Rating.Easy].card.due, now),
      },
    };
  }

  static applyReview(
    card: FSRSCard,
    rating: CardRating,
    now: Date = new Date()
  ): RecordLogItem {
    const grade = RATING_MAP[rating];
    const schedulingCards = f.repeat(card, now);
    return schedulingCards[grade];
  }
}
