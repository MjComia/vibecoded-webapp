import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index.js";
import { AnalyticsService } from "../src/services/analytics.service.js";

describe("Phase 6: Real Analytics & Mastery Engine", () => {
  it("GET /api/analytics returns NLE mastery with fixed 75% PRC passing threshold", async () => {
    const res = await request(app).get("/api/analytics?exam=NLE");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const a = res.body.analytics;
    expect(a).toBeDefined();
    expect(a.exam).toBe("NLE");
    expect(a.passingThreshold).toBe(75);
    expect(a.minimumSubjectThreshold).toBe(60);
    expect(typeof a.overallReadiness).toBe("number");
    expect(["Likely to Pass", "Borderline", "At Risk"]).toContain(a.passLikelihood);
    expect(a.parts.length).toBe(5);
    expect(a.radarData.length).toBe(5);
  });

  it("identifies critical sub-60% subjects and flags primary weak area", async () => {
    const res = await request(app).get("/api/analytics?exam=NLE");
    const a = res.body.analytics;

    expect(a.weakAreas.length).toBeGreaterThan(0);
    expect(a.primaryWeakArea).toBeDefined();
    expect(a.primaryWeakArea.masteryPercentage).toBeLessThan(75);

    // Verify weak drill recommendation targets 10 questions
    expect(a.weakDrillRecommendation).toBeDefined();
    expect(a.weakDrillRecommendation.questionCount).toBe(10);
    expect(a.weakDrillRecommendation.topic).toBe(a.primaryWeakArea.topic);
  });

  it("GET /api/analytics?exam=NCLEX-RN returns NCLEX categories and radar metrics", async () => {
    const res = await request(app).get("/api/analytics?exam=NCLEX-RN");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics.exam).toBe("NCLEX-RN");
    expect(res.body.analytics.passingThreshold).toBe(75);
    expect(res.body.analytics.radarData.length).toBe(5);
  });

  it("GET /api/analytics/weak-drill returns quick drill recommendation", async () => {
    const res = await request(app).get("/api/analytics/weak-drill");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.recommendation).toBeDefined();
    expect(res.body.recommendation.questionCount).toBe(10);
  });

  it("POST /api/analytics/record accepts quiz and mock attempts", async () => {
    const res = await request(app)
      .post("/api/analytics/record")
      .send({
        type: "quiz",
        subject: "Part III: Care of Clients",
        topic: "Fluid Volume Deficit & IV Flow Rates",
        score: 9,
        total: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedAnalytics).toBeDefined();
  });
});
