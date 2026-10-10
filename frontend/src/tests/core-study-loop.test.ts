import { describe, it, expect } from "vitest";
import {
  computeNextIntervals,
  applyCardReview,
  createNewCard,
  formatInterval,
} from "../lib/srs";

describe("Phase 2: Core Study Loop (FSRS & Study Components)", () => {
  it("computes 4 standard FSRS intervals (Again, Hard, Good, Easy)", () => {
    const card = createNewCard();
    const intervals = computeNextIntervals(card);

    expect(intervals.Again).toBeDefined();
    expect(intervals.Hard).toBeDefined();
    expect(intervals.Good).toBeDefined();
    expect(intervals.Easy).toBeDefined();

    expect(intervals.Again.due.getTime()).toBeLessThanOrEqual(intervals.Hard.due.getTime());
    expect(intervals.Hard.due.getTime()).toBeLessThanOrEqual(intervals.Good.due.getTime());
    expect(intervals.Good.due.getTime()).toBeLessThan(intervals.Easy.due.getTime());
  });

  it("formats short and long intervals into readable labels", () => {
    const now = new Date("2026-10-10T12:00:00Z");

    const in30s = new Date(now.getTime() + 30 * 1000);
    expect(formatInterval(in30s, now)).toBe("< 1m");

    const in10m = new Date(now.getTime() + 10 * 60 * 1000);
    expect(formatInterval(in10m, now)).toBe("10m");

    const in2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    expect(formatInterval(in2d, now)).toBe("2d");

    const in60d = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    expect(formatInterval(in60d, now)).toBe("2mo");
  });

  it("advances card state across multiple successful ratings", () => {
    const t0 = new Date("2026-10-10T12:00:00Z");
    let card = createNewCard(t0);

    const r1 = applyCardReview(card, "Good", t0);
    card = r1.card;
    expect(card.reps).toBe(1);

    const r2 = applyCardReview(card, "Good", card.due);
    card = r2.card;
    expect(card.reps).toBe(2);

    const r3 = applyCardReview(card, "Easy", card.due);
    card = r3.card;
    expect(card.reps).toBe(3);
    expect(card.stability).toBeGreaterThan(0);
  });

  it("resets/shortens interval upon receiving 'Again' rating", () => {
    const t0 = new Date("2026-10-10T12:00:00Z");
    let card = createNewCard(t0);

    // Rate Good
    card = applyCardReview(card, "Good", t0).card;
    const goodDueDate = card.due.getTime();

    // Now fail with Again
    const failedReview = applyCardReview(card, "Again", new Date(goodDueDate));
    const againDueDate = failedReview.card.due.getTime();

    // Again should reset due date much sooner
    expect(againDueDate).toBeLessThan(goodDueDate + 24 * 60 * 60 * 1000);
  });
});
