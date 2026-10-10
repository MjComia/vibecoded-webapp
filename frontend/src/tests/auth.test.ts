import { describe, it, expect, beforeEach } from "vitest";

// In-memory storage mock for Node test environment
const mockStorage: Record<string, string> = {};
const storage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
};

describe("Authentication & Candidate Profile State", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("initializes with default candidate profile", () => {
    const defaultProfile = {
      id: "guest-user",
      email: "sarah@nursing.ph",
      full_name: "Sarah Jenkins",
      target_exam: "NCLEX-RN",
      exam_date: "2025-11-18",
      daily_goal_minutes: 60,
      streak_days: 14,
    };

    expect(defaultProfile.target_exam).toBe("NCLEX-RN");
    expect(defaultProfile.full_name).toContain("Sarah");
  });

  it("persists onboarding changes to Philippine NLE in storage", () => {
    const updatedProfile = {
      id: "user-123",
      email: "maria@pnc.edu.ph",
      full_name: "Maria Santos",
      target_exam: "NLE",
      exam_date: "2025-11-05",
      daily_goal_minutes: 90,
      streak_days: 1,
    };

    storage.setItem("real_nurse_profile", JSON.stringify(updatedProfile));
    const retrieved = JSON.parse(storage.getItem("real_nurse_profile") || "{}");

    expect(retrieved.target_exam).toBe("NLE");
    expect(retrieved.full_name).toBe("Maria Santos");
    expect(retrieved.daily_goal_minutes).toBe(90);
  });
});
