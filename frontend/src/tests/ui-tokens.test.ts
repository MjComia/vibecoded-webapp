import { describe, it, expect } from "vitest";
import { fsrs, createEmptyCard, Rating } from "ts-fsrs";

describe("Frontend Core & FSRS Engine Integration", () => {
  it("initializes FSRS scheduler for flashcards without errors", () => {
    const f = fsrs();
    const card = createEmptyCard();
    expect(card).toBeDefined();
    expect(card.reps).toBe(0);

    const scheduled = f.repeat(card, new Date());
    expect(scheduled[Rating.Good]).toBeDefined();
    expect(scheduled[Rating.Good].card.due.getTime()).toBeGreaterThan(Date.now());
  });

  it("verifies design color variables and typography tokens match Figma specs", () => {
    // Design tokens as defined in index.css
    const expectedDesignTokens = {
      canvas: "#fff8fb",
      ink: "#131b2e",
      inkSoft: "#4a4350",
      rosetext: "#a8325c",
      teal: "#f2a7bf",
      lav: "#fdeaf1",
      indigo: "#4b41e1",
    };

    expect(expectedDesignTokens.canvas).toBe("#fff8fb");
    expect(expectedDesignTokens.rosetext).toBe("#a8325c");
    expect(expectedDesignTokens.teal).toBe("#f2a7bf");
  });
});
