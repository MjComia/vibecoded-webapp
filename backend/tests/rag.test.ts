import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { documentRouter } from "../src/routes/document.routes.js";
import { RAGService } from "../src/services/rag.service.js";

const app = express();
app.use(express.json());
app.use("/api/documents", documentRouter);

describe("Phase 5: Document Hub & Grounded RAG", () => {
  it("extracts and chunks text preserving page numbers", async () => {
    const samplePages = [
      { pageNumber: 1, text: "Digoxin increases myocardial contractility. Therapeutic level is 0.5 to 2.0 ng/mL." },
      { pageNumber: 2, text: "Assess apical pulse for 1 full minute. Withhold if heart rate is below 60 bpm." },
    ];

    const chunks = RAGService.chunkPages("test-doc", samplePages);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[1].content).toContain("apical pulse");
  });

  it("GET /api/documents returns seed documents with page counts and ready status", async () => {
    const res = await request(app).get("/api/documents");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.documents)).toBe(true);
    expect(res.body.documents.length).toBeGreaterThan(0);

    const doc = res.body.documents[0];
    expect(doc.id).toBeDefined();
    expect(doc.pageCount).toBeGreaterThan(0);
    expect(doc.status).toBe("ready");
  });

  it("POST /api/documents/:id/chat returns answer with citations", async () => {
    const res = await request(app)
      .post("/api/documents/doc-saunders-pharm/chat")
      .send({ query: "When should I withhold digoxin?" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.answer).toBeDefined();
    expect(Array.isArray(res.body.citations)).toBe(true);
    expect(res.body.citations.length).toBeGreaterThan(0);
    expect(res.body.citations[0].pageNumber).toBeDefined();
  }, 15000);

  it("POST /api/documents/:id/chat responds warmly to greetings without failure message", async () => {
    const res = await request(app)
      .post("/api/documents/doc-saunders-pharm/chat")
      .send({ query: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.answer).toBeDefined();
    expect(res.body.answer).not.toContain("I couldn't find relevant content");
    expect(res.body.answer.toLowerCase()).toMatch(/hello|study|nurse|partner|tutor/i);
    expect(Array.isArray(res.body.citations)).toBe(true);
  }, 25000);

  it("DELETE /api/documents/:id permanently removes document and does not resurrect on GET", async () => {
    // Delete seed document for a test user
    const deleteRes = await request(app).delete("/api/documents/doc-brunner-endocrine?userId=test-user-123");
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // List documents for this user
    const listRes = await request(app).get("/api/documents?userId=test-user-123");
    expect(listRes.status).toBe(200);
    const docIds = listRes.body.documents.map((d: any) => d.id);
    expect(docIds).not.toContain("doc-brunner-endocrine");
  });
});
