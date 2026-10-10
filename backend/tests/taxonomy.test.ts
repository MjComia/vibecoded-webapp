import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index.js";

describe("Taxonomy & Curriculum Endpoints", () => {
  it("GET /api/taxonomy returns both NLE and NCLEX-RN syllabus structures", async () => {
    const res = await request(app).get("/api/taxonomy");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("GET /api/taxonomy?exam=NLE returns Philippine NLE 5 parts", async () => {
    const res = await request(app).get("/api/taxonomy?exam=NLE");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const names = res.body.data.map((s: any) => s.name);
    expect(names.some((n: string) => n.includes("Part I"))).toBe(true);
  });

  it("GET /api/taxonomy?exam=NCLEX-RN returns NCLEX client needs categories", async () => {
    const res = await request(app).get("/api/taxonomy?exam=NCLEX-RN");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const codes = res.body.data.map((s: any) => s.code);
    expect(codes).toContain("NCLEX-PHARM");
  });

  it("GET /api/profile returns 401 when no bearer token is supplied", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
