import { describe, it, expect } from "vitest";
import { fetchAnalytics, recordStudyAttempt } from "../lib/api";

describe("Phase 6: Frontend Analytics & Mastery Engine", () => {
  it("fetches NLE analytics with 75% passing threshold and 60% minimum rule", async () => {
    const data = await fetchAnalytics("NLE");

    expect(data).toBeDefined();
    expect(data.exam).toBe("NLE");
    expect(data.passingThreshold).toBe(75);
    expect(data.minimumSubjectThreshold).toBe(60);
    expect(data.parts.length).toBe(5);
    expect(data.radarData.length).toBe(5);
    expect(["Likely to Pass", "Borderline", "At Risk"]).toContain(data.passLikelihood);
  });

  it("identifies lowest-scoring topic and recommends a 10-item weak drill", async () => {
    const data = await fetchAnalytics("NLE");

    expect(data.weakAreas.length).toBeGreaterThan(0);
    expect(data.primaryWeakArea).toBeDefined();
    expect(data.primaryWeakArea?.masteryPercentage).toBeLessThan(75);

    expect(data.weakDrillRecommendation).toBeDefined();
    expect(data.weakDrillRecommendation?.questionCount).toBe(10);
    expect(data.weakDrillRecommendation?.targetScore).toBe(75);
  });

  it("fetches NCLEX-RN analytics with categories and radar points", async () => {
    const data = await fetchAnalytics("NCLEX-RN");

    expect(data).toBeDefined();
    expect(data.exam).toBe("NCLEX-RN");
    expect(data.passingThreshold).toBe(75);
    expect(data.radarData.length).toBe(5);
  });

  it("supports recording study attempts gracefully", async () => {
    await expect(
      recordStudyAttempt({
        type: "quiz",
        subject: "Part III: Care of Clients",
        topic: "Fluid Volume Deficit & IV Flow Rates",
        score: 8,
        total: 10,
      })
    ).resolves.not.toThrow();
  });
});
