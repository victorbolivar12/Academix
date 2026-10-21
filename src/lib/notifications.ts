export const DAILY_REMINDER_HOUR = 8;

const LAST_NOTIFICATION_KEY = "academix:last-notification-date";

export type NotificationState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export interface WorkReminderItem {
  titulo: string | null;
  hora: string | null;
  codigo: string | null;
}

export function getNotificationState(): NotificationState {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission as NotificationState;
}

export async function requestNotificationPermission(): Promise<NotificationState> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission !== "default") {
    return Notification.permission as NotificationState;
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotificationState;
  } catch {
    return "denied";
  }
}

export function getNextReminderDelay(now: Date = new Date()): number {
  const next = new Date(now.getTime());
  next.setHours(DAILY_REMINDER_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function isReminderTimePassed(now: Date = new Date()): boolean {
  return now.getHours() >= DAILY_REMINDER_HOUR;
}

export function getLastNotificationDate(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_NOTIFICATION_KEY);
}

export function setLastNotificationDate(date: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_NOTIFICATION_KEY, date);
}

export function showWorkNotification(
  dateLabel: string,
  items: WorkReminderItem[],
): boolean {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return false;
  }

  const details = items.slice(0, 4).map((item) => {
    const hora = item.hora ? `${item.hora} · ` : "";
    return `${hora}${item.titulo ?? "Trabajo"}`;
  });
  const remaining = items.length - details.length;
  const body =
    remaining > 0
      ? `${details.join("\n")}\n+${remaining} más`
      : details.join("\n");

  try {
    const notification = new Notification(
      `Trabajos para ${dateLabel}: ${items.length}`,
      { body, tag: `academix-${dateLabel}` },
    );
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
