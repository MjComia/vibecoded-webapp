import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isStudyReminderEnabled,
  setStudyReminderEnabled,
  getNotificationPermission,
  checkDailyDueCardsReminder,
} from "../lib/notifications";
import { registerServiceWorker } from "../lib/offline";

describe("Phase 8 - PWA, Offline & Notifications", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);

    // Setup global localStorage mock
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };

    (globalThis as any).window = globalThis;
    vi.restoreAllMocks();
  });

  it("stores and retrieves study reminder preference correctly", () => {
    expect(isStudyReminderEnabled()).toBe(false);

    setStudyReminderEnabled(true);
    expect(isStudyReminderEnabled()).toBe(true);
    expect(store["real_nurse_notifications_enabled"]).toBe("true");

    setStudyReminderEnabled(false);
    expect(isStudyReminderEnabled()).toBe(false);
    expect(store["real_nurse_notifications_enabled"]).toBe("false");
  });

  it("gracefully returns 'unsupported' if Notification is absent", () => {
    const original = (globalThis as any).Notification;
    delete (globalThis as any).Notification;

    expect(getNotificationPermission()).toBe("unsupported");

    if (original) {
      (globalThis as any).Notification = original;
    }
  });

  it("registers service worker safely without throwing", async () => {
    const result = await registerServiceWorker();
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("does not send daily reminder when notifications are disabled or 0 cards due", async () => {
    setStudyReminderEnabled(false);
    await checkDailyDueCardsReminder(10);
    expect(store["real_nurse_last_notified_date"]).toBeUndefined();

    setStudyReminderEnabled(true);
    await checkDailyDueCardsReminder(0);
    expect(store["real_nurse_last_notified_date"]).toBeUndefined();
  });
});
