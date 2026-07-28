import { MessageCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOptionalChatSocket } from "../context/ChatSocketContext";

export function NotificationToasts() {
  const { user } = useAuth();
  const chat = useOptionalChatSocket();

  if (!user || !chat || chat.toasts.length === 0) return null;

  const messagesPath =
    user.role === "therapist" ? "/therapist/dashboard?tab=messages" : "/dashboard?tab=messages";

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {chat.toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-black/5"
          role="alert"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <MessageCircle className="h-5 w-5 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{toast.senderName}</p>
            <p className="mt-0.5 truncate text-sm text-slate-600">{toast.preview}</p>
            <Link
              to={messagesPath}
              className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
            >
              View message
            </Link>
          </div>
          <button
            onClick={() => chat.dismissToast(toast.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
