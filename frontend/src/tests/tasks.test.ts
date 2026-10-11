import { describe, it, expect, beforeEach } from "vitest";

const storage: Record<string, string> = {};
if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    length: 0,
    key: () => null,
  };
}

describe("Study Tasks Checklist & Zero-State Integrity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to an empty task list for new users with no hardcoded pre-checked items", () => {
    const saved = localStorage.getItem("real_nurse_tasks");
    const tasks = saved ? JSON.parse(saved) : [];

    expect(tasks).toEqual([]);
    expect(tasks.length).toBe(0);
  });

  it("correctly saves, toggles, and deletes custom candidate tasks", () => {
    const newTask = {
      id: "t-test-1",
      title: "Review Cardiac Pharmacology flashcards",
      kind: "cards",
      day: "Today",
      done: false,
    };

    let tasks = [newTask];
    localStorage.setItem("real_nurse_tasks", JSON.stringify(tasks));

    // Retrieve
    let loaded = JSON.parse(localStorage.getItem("real_nurse_tasks") || "[]");
    expect(loaded.length).toBe(1);
    expect(loaded[0].done).toBe(false);

    // Toggle
    tasks = tasks.map((t) => (t.id === "t-test-1" ? { ...t, done: true } : t));
    localStorage.setItem("real_nurse_tasks", JSON.stringify(tasks));
    loaded = JSON.parse(localStorage.getItem("real_nurse_tasks") || "[]");
    expect(loaded[0].done).toBe(true);

    // Delete
    tasks = tasks.filter((t) => t.id !== "t-test-1");
    localStorage.setItem("real_nurse_tasks", JSON.stringify(tasks));
    loaded = JSON.parse(localStorage.getItem("real_nurse_tasks") || "[]");
    expect(loaded.length).toBe(0);
  });
});
