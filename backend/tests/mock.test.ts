import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index.js";

describe("Phase 4: Assessment & Mock Exam Engine", () => {
  it("POST /api/quiz/generate creates questions with valid distractors and rationales", async () => {
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({
        subject: "Pharmacology",
        topic: "Cardiac Glycosides",
        difficulty: "Board-level",
        count: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quiz.questions.length).toBe(2);
    expect(res.body.quiz.questions[0].options.length).toBe(4);
    expect(res.body.quiz.questions[0].rationale).toBeDefined();
  }, 20000);

  it("POST /api/mock/start creates session with server-enforced timer and zero answer leakage", async () => {
    const res = await request(app)
      .post("/api/mock/start")
      .send({
        examType: "NCLEX-RN",
        durationMinutes: 15,
        itemCount: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attemptId).toBeDefined();

    // Verify server timing
    expect(res.body.expiresAt).toBeGreaterThan(res.body.serverTime);
    const calculatedMinutes = (res.body.expiresAt - res.body.serverTime) / (60 * 1000);
    expect(Math.round(calculatedMinutes)).toBe(15);

    // CRITICAL SECURITY / ANTI-CHEAT TEST:
    // Verify client payload DOES NOT contain correct_answer_index or rationale!
    res.body.questions.forEach((q: any) => {
      expect(q.correct_answer_index).toBeUndefined();
      expect(q.rationale).toBeUndefined();
      expect(q.stem).toBeDefined();
      expect(q.options.length).toBe(4);
    });
  });

  it("POST /api/mock/:attemptId/save-answer autosaves candidate answers", async () => {
    // Start session
    const startRes = await request(app)
      .post("/api/mock/start")
      .send({ examType: "NLE", durationMinutes: 10, itemCount: 3 });

    const attemptId = startRes.body.attemptId;
    const questionId = startRes.body.questions[0].id;

    // Autosave answer
    const saveRes = await request(app)
      .post(`/api/mock/${attemptId}/save-answer`)
      .send({ questionId, selectedOption: 1, isFlagged: true });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
  });

  it("POST /api/mock/:attemptId/submit grades answers and returns full diagnostic rationales", async () => {
    // Start session
    const startRes = await request(app)
      .post("/api/mock/start")
      .send({ examType: "NCLEX-RN", durationMinutes: 10, itemCount: 3 });

    const attemptId = startRes.body.attemptId;

    // Submit attempt
    const submitRes = await request(app)
      .post(`/api/mock/${attemptId}/submit`)
      .send();

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.scorePercentage).toBeDefined();
    expect(submitRes.body.breakdownBySubject).toBeDefined();
    expect(submitRes.body.reviewItems.length).toBe(3);

    // Now rationales and correct answers are revealed
    submitRes.body.reviewItems.forEach((item: any) => {
      expect(item.correctAnswerIndex).toBeDefined();
      expect(item.rationale).toBeDefined();
    });
  });
});
