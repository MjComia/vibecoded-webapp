import { describe, it, expect } from "vitest";
import { SRSService, formatInterval } from "../src/services/srs.service.js";

describe("SRS Service (FSRS Algorithm)", () => {
  it("initializes an empty card with valid default state", () => {
    const card = SRSService.createInitialCard();
    expect(card).toBeDefined();
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.due).toBeInstanceOf(Date);
  });

  it("calculates next intervals with human-readable labels for all 4 ratings", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    const card = SRSService.createInitialCard(now);
    const intervals = SRSService.getNextIntervals(card, now);

    expect(intervals.Again).toBeDefined();
    expect(intervals.Hard).toBeDefined();
    expect(intervals.Good).toBeDefined();
    expect(intervals.Easy).toBeDefined();

    expect(intervals.Again.due.getTime()).toBeLessThanOrEqual(intervals.Hard.due.getTime());
    expect(intervals.Hard.due.getTime()).toBeLessThanOrEqual(intervals.Good.due.getTime());
    expect(intervals.Good.due.getTime()).toBeLessThan(intervals.Easy.due.getTime());

    expect(typeof intervals.Hard.label).toBe("string");
    expect(typeof intervals.Good.label).toBe("string");
    expect(typeof intervals.Easy.label).toBe("string");
  });

  it("advances card due date and increases stability after consecutive Good ratings", () => {
    const t0 = new Date("2026-10-10T12:00:00Z");
    let card = SRSService.createInitialCard(t0);

    // First review: Good
    const review1 = SRSService.applyReview(card, "Good", t0);
    card = review1.card;
    expect(card.reps).toBe(1);

    // Second review on due date
    const t1 = card.due;
    const review2 = SRSService.applyReview(card, "Good", t1);
    card = review2.card;
    expect(card.reps).toBe(2);

    // Third review
    const t2 = card.due;
    const review3 = SRSService.applyReview(card, "Good", t2);
    card = review3.card;
    expect(card.reps).toBe(3);

    // Interval should increase significantly across 3 successful reviews
    const elapsedDays = (card.due.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24);
    expect(elapsedDays).toBeGreaterThan(1);
  });

  it("formats date intervals correctly into human-friendly strings", () => {
    const base = new Date("2026-10-10T12:00:00Z");
    expect(formatInterval(new Date(base.getTime() + 10 * 60 * 1000), base)).toBe("10 min");
    expect(formatInterval(new Date(base.getTime() + 2 * 60 * 60 * 1000), base)).toBe("2 hr");
    expect(formatInterval(new Date(base.getTime() + 24 * 60 * 60 * 1000), base)).toBe("1 day");
    expect(formatInterval(new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000), base)).toBe("5 days");
  });
});
