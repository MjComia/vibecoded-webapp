import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { mockRouter } from "../src/routes/mock.routes.js";
import { quizRouter } from "../src/routes/quiz.routes.js";
import { documentRouter } from "../src/routes/document.routes.js";
import { SRSService } from "../src/services/srs.service.js";

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use("/api/mock", mockRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/documents", documentRouter);

// SRS Endpoints
app.post("/api/srs/review", (req, res) => {
  try {
    const { card, rating } = req.body;
    if (!rating || !["Again", "Hard", "Good", "Easy"].includes(rating)) {
      return res.status(400).json({ success: false, error: "Invalid rating" });
    }
    const result = SRSService.applyReview(card || SRSService.createInitialCard(), rating);
    res.json({ success: true, updatedCard: result.card });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

describe("Phase 9: Security Audit & Boundary Hardening", () => {
  it("anti-cheat: /api/mock/start NEVER returns correct_answer_index or rationale to client", async () => {
    const res = await request(app)
      .post("/api/mock/start")
      .send({ examType: "NCLEX-RN", durationMinutes: 10, itemCount: 4 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.questions)).toBe(true);

    for (const q of res.body.questions) {
      expect(q.stem).toBeDefined();
      expect(q.options).toBeDefined();
      expect(q.correct_answer_index).toBeUndefined();
      expect(q.rationale).toBeUndefined();
    }
  });

  it("resource exhaustion protection: rejects quiz generation requesting > 20 items", async () => {
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({ count: 50, subject: "Pharmacology" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Validation error");
  });

  it("input boundary protection: /api/srs/review rejects invalid rating strings", async () => {
    const res = await request(app)
      .post("/api/srs/review")
      .send({ rating: "SuperEasy" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid rating");
  });

  it("file upload validation: rejects executable/disallowed file extensions", async () => {
    const res = await request(app)
      .post("/api/documents/upload")
      .attach("file", Buffer.from("malicious executable content"), "virus.exe");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Unsupported file type");
  });

  it("file upload boundary: rejects uploads larger than 25 MB", async () => {
    // Generate a 26 MB buffer in memory
    const largeBuffer = Buffer.alloc(26 * 1024 * 1024, 0);

    const res = await request(app)
      .post("/api/documents/upload")
      .attach("file", largeBuffer, "oversized_book.pdf");

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("25 MB");
  });
});
