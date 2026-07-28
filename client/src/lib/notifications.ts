export type NotificationSupport = NotificationPermission | "unsupported";

export function getNotificationPermission(): NotificationSupport {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function isTabInBackground(): boolean {
  return document.visibilityState === "hidden";
}

export function showBrowserNotification(params: {
  title: string;
  body: string;
  tag?: string;
  onClick?: () => void;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!isTabInBackground()) return;

  const notification = new Notification(params.title, {
    body: params.body,
    tag: params.tag,
    icon: "/favicon.ico",
    requireInteraction: false,
  });

  notification.onclick = () => {
    window.focus();
    params.onClick?.();
    notification.close();
  };
}
