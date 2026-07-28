import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationSupport,
} from "../lib/notifications";

const DISMISS_KEY = "therapyconnect-notif-banner-dismissed";

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationSupport>(() => getNotificationPermission());
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const sync = () => setPermission(getNotificationPermission());
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const canUseChat = user?.role === "client" || user?.role === "therapist";
  if (!canUseChat || permission === "unsupported" || permission === "granted") return null;
  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const enable = async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "granted") dismiss();
    } finally {
      setRequesting(false);
    }
  };

  const isDenied = permission === "denied";

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[99] mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 shadow-lg sm:left-auto"
      role="status"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
        {isDenied ? (
          <BellOff className="h-5 w-5 text-primary-700" />
        ) : (
          <Bell className="h-5 w-5 text-primary-700" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {isDenied ? "Browser notifications are blocked" : "Get notified on other tabs"}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          {isDenied
            ? "Allow notifications for this site in your browser settings to see new messages when TherapyConnect is open in another tab."
            : "Allow notifications so you get a desktop alert when a new message arrives while you're on a different tab."}
        </p>
        {!isDenied && (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={requesting}
            className="btn-primary mt-3 py-2 text-sm disabled:opacity-50"
          >
            {requesting ? "Enabling..." : "Enable notifications"}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/80 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
