import { describe, it, expect } from "vitest";
import { generateStudyPlan, type PlannerConfig } from "../lib/planner";

describe("Phase 3: Backward-Planning Study Engine", () => {
  const baseConfig: PlannerConfig = {
    examDate: "2026-11-20",
    hoursPerDay: 4,
    restDayMode: "sunday",
    customRestDays: [0],
    weakSubjects: ["Pharmacology"],
    mockSprintWeeks: 2,
    examType: "NCLEX-RN",
  };

  it("generates a complete schedule ending on the target exam date", () => {
    const start = new Date("2026-11-01");
    const plan = generateStudyPlan(baseConfig, start);

    expect(plan["2026-11-20"]).toBeDefined();
    expect(plan["2026-11-20"].isExamDay).toBe(true);
  });

  it("schedules rest days on Sundays when restDayMode is sunday", () => {
    const start = new Date("2026-11-01"); // Sunday
    const plan = generateStudyPlan(baseConfig, start);

    // 2026-11-01 is a Sunday
    expect(plan["2026-11-01"].kind).toBe("Rest");
    expect(plan["2026-11-01"].targetMinutes).toBe(0);

    // 2026-11-08 is the next Sunday
    expect(plan["2026-11-08"].kind).toBe("Rest");
  });

  it("supports continuous 7-day study plans without scheduled rest days", () => {
    const configNoRest: PlannerConfig = {
      ...baseConfig,
      restDayMode: "none",
    };

    const start = new Date("2026-11-01");
    const plan = generateStudyPlan(configNoRest, start);

    // Should not be marked rest simply for being Sunday (except day right before exam)
    expect(plan["2026-11-01"].kind).not.toBe("Rest");
  });

  it("supports customizable rest days (e.g. Wednesday and Saturday off)", () => {
    const configCustom: PlannerConfig = {
      ...baseConfig,
      restDayMode: "custom",
      customRestDays: [3, 6], // Wed, Sat
    };

    const start = new Date("2026-11-01");
    const plan = generateStudyPlan(configCustom, start);

    // 2026-11-04 is Wednesday (day 3)
    expect(plan["2026-11-04"].kind).toBe("Rest");
    // 2026-11-07 is Saturday (day 6)
    expect(plan["2026-11-07"].kind).toBe("Rest");
    // 2026-11-05 is Thursday -> should NOT be Rest
    expect(plan["2026-11-05"].kind).not.toBe("Rest");
  });

  it("front-loads weak clinical subjects with higher frequency", () => {
    const start = new Date("2026-10-01");
    const plan = generateStudyPlan(
      { ...baseConfig, weakSubjects: ["Pharmacology"] },
      start
    );

    const nonRestDays = Object.values(plan).filter((d) => d.kind !== "Rest" && !d.isExamDay);
    const pharmDays = nonRestDays.filter((d) => d.subject === "Pharmacology").length;
    const medSurgDays = nonRestDays.filter((d) => d.subject === "Med-Surg").length;

    // Weak subject should appear significantly more often
    expect(pharmDays).toBeGreaterThan(medSurgDays);
  });

  it("allows specific day rescheduling overrides", () => {
    const start = new Date("2026-11-01");
    const overrides = { "2026-11-03": "Practice test" as const };
    const plan = generateStudyPlan(baseConfig, start, overrides);

    expect(plan["2026-11-03"].kind).toBe("Practice test");
    expect(plan["2026-11-03"].isRescheduled).toBe(true);
  });
});
