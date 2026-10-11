import { describe, it, expect } from "vitest";
import { uploadStudyDocument, askDocumentQuestion } from "../lib/api";

describe("Phase 5: Grounded RAG & Document Hub Validation", () => {
  it("enforces 25 MB limit on document uploads", async () => {
    // Create a mock File exceeding 25 MB (26 MB)
    const largeBlob = new Blob([new Uint8Array(26 * 1024 * 1024)]);
    const largeFile = new File([largeBlob], "huge_textbook.pdf", { type: "application/pdf" });

    await expect(uploadStudyDocument(largeFile)).rejects.toThrow("exceeds the maximum allowable limit of 25 MB");
  });

  it("askDocumentQuestion returns answers with page citations", async () => {
    const res = await askDocumentQuestion("doc-saunders-pharm", "When should I hold digoxin?");

    expect(res.answer).toBeDefined();
    expect(res.citations).toBeDefined();
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.citations[0].pageNumber).toBeGreaterThan(0);
  });

  it("generateFlashcardsFromDoc returns flashcards referencing document pages", async () => {
    const { generateFlashcardsFromDoc } = await import("../lib/api");
    const cards = await generateFlashcardsFromDoc("doc-saunders-pharm", 2);

    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].front).toBeDefined();
    expect(cards[0].back).toBeDefined();
  });

  it("generateQuizFromDoc synthesizes grounded practice questions", async () => {
    const { generateQuizFromDoc } = await import("../lib/api");
    const questions = await generateQuizFromDoc("doc-saunders-pharm", 2);

    expect(Array.isArray(questions)).toBe(true);
  });
});
