import { describe, it, expect } from "vitest";
import { generateAIQuiz, fetchAnalytics, askDocumentQuestion } from "../lib/api";
import { createNewCard, applyCardReview } from "../lib/srs";

describe("Phase 9: End-to-End Cross-Feature Integration", () => {
  it("complete study loop: identifies weak areas from analytics and prepares targeted drill", async () => {
    // 1. Fetch current analytics
    const analytics = await fetchAnalytics("NLE");
    expect(analytics.overallReadiness).toBeGreaterThanOrEqual(0);
    expect(analytics.primaryWeakArea).toBeDefined();

    const weakSubject = analytics.primaryWeakArea.subject;
    const weakTopic = analytics.primaryWeakArea.topic;

    // 2. Synthesize targeted drill based on weak area
    const drillQuestions = await generateAIQuiz({
      subject: weakSubject,
      topic: weakTopic,
      difficulty: "Board-level",
      count: 3,
    });

    expect(drillQuestions.length).toBe(3);
    expect(drillQuestions[0].subject).toBe(weakSubject);
    expect(drillQuestions[0].options.length).toBe(4);
    expect(drillQuestions[0].correct_answer_index).toBeGreaterThanOrEqual(0);
    expect(drillQuestions[0].correct_answer_index).toBeLessThanOrEqual(3);
  }, 15000);

  it("document grounding to FSRS: extracts facts with citations for spaced repetition study", async () => {
    // 1. Query grounded document
    const res = await askDocumentQuestion("doc-saunders-pharm", "When should I hold digoxin?");
    expect(res.answer).toBeDefined();
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.citations[0].pageNumber).toBeGreaterThan(0);

    // 2. Create and review a flashcard for this concept
    const initialCard = createNewCard();
    expect(initialCard.state).toBe(0); // New card (State.New = 0)

    // Rating "Good"
    const goodReview = applyCardReview(initialCard, "Good");
    expect(goodReview.card.stability).toBeGreaterThan(0);
    expect(goodReview.card.reps).toBe(1);

    // Rating "Again" (lapses card)
    const lapseReview = applyCardReview(goodReview.card, "Again");
    expect(lapseReview.card.reps).toBe(2);
  }, 15000);
});
