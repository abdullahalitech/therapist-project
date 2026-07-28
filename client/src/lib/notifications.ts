export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showBrowserNotification(params: {
  title: string;
  body: string;
  onClick?: () => void;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const notification = new Notification(params.title, {
    body: params.body,
    icon: "/favicon.ico",
  });

  notification.onclick = () => {
    window.focus();
    params.onClick?.();
    notification.close();
  };
}
