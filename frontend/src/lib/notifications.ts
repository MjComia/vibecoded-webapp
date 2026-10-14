/**
 * Study reminder & Web Notifications system for Real Nurse candidates.
 */

const STORAGE_KEY_ENABLED = 'real_nurse_notifications_enabled';
const STORAGE_KEY_LAST_NOTIFIED = 'real_nurse_last_notified_date';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isStudyReminderEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
}

export function setStudyReminderEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
}

export async function requestStudyNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setStudyReminderEnabled(granted);
    return granted;
  } catch (error) {
    console.warn('[Notifications] Error requesting permission:', error);
    return false;
  }
}

export async function sendStudyReminder(
  title: string,
  body: string,
  url = '/'
): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') {
    return false;
  }

  try {
    // If service worker is ready, use registration.showNotification
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: { url },
          tag: 'study-reminder',
        });
        return true;
      }
    }

    // Fallback to desktop Notification constructor
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'study-reminder',
    });
    return true;
  } catch (error) {
    console.warn('[Notifications] Error displaying reminder:', error);
    return false;
  }
}

/**
 * Checks if cards are due and sends at most one reminder notification per calendar day.
 */
export async function checkDailyDueCardsReminder(dueCount: number): Promise<void> {
  if (!isStudyReminderEnabled() || dueCount <= 0) return;
  if (getNotificationPermission() !== 'granted') return;

  const today = new Date().toISOString().slice(0, 10);
  const lastNotified = localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);

  if (lastNotified === today) {
    // Already notified today
    return;
  }

  const title = 'Real Nurse: Spaced Repetition Due';
  const body = `You have ${dueCount} flashcard${dueCount === 1 ? '' : 's'} scheduled for review today. Stay sharp for the board exam!`;

  const sent = await sendStudyReminder(title, body, '/');
  if (sent) {
    localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, today);
  }
}
