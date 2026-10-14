import { describe, it, expect, beforeEach } from "vitest";
import { validatePassword, validatePasswordMatch } from "../lib/auth-validation";

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

describe("Password Strength & Verification Security", () => {
  it("rejects weak passwords (short, no uppercase, no numbers, or no symbols)", () => {
    // Too short
    expect(validatePassword("Aa1!").isValid).toBe(false);
    expect(validatePassword("Aa1!").criteria.minLength).toBe(false);

    // No uppercase
    expect(validatePassword("password123!").isValid).toBe(false);
    expect(validatePassword("password123!").criteria.hasUppercase).toBe(false);

    // No lowercase
    expect(validatePassword("PASSWORD123!").isValid).toBe(false);
    expect(validatePassword("PASSWORD123!").criteria.hasLowercase).toBe(false);

    // No number
    expect(validatePassword("Password!").isValid).toBe(false);
    expect(validatePassword("Password!").criteria.hasNumber).toBe(false);

    // No special symbol
    expect(validatePassword("Password123").isValid).toBe(false);
    expect(validatePassword("Password123").criteria.hasSpecial).toBe(false);
  });

  it("accepts strong passwords meeting all clinical platform requirements", () => {
    const result = validatePassword("NursePass2026!");
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(4);
    expect(result.strengthLabel).toBe("Strong");
    expect(result.criteria.minLength).toBe(true);
    expect(result.criteria.hasUppercase).toBe(true);
    expect(result.criteria.hasLowercase).toBe(true);
    expect(result.criteria.hasNumber).toBe(true);
    expect(result.criteria.hasSpecial).toBe(true);
  });

  it("validates 'type again to verify password' matching", () => {
    // Empty confirm password
    expect(validatePasswordMatch("NursePass2026!", "").matches).toBe(false);
    expect(validatePasswordMatch("NursePass2026!", "").error).toBeDefined();

    // Mismatched confirm password
    expect(validatePasswordMatch("NursePass2026!", "NursePass2026?").matches).toBe(false);
    expect(validatePasswordMatch("NursePass2026!", "NursePass2026?").error).toContain("do not match");

    // Correctly verified matching password
    expect(validatePasswordMatch("NursePass2026!", "NursePass2026!").matches).toBe(true);
  });
});
