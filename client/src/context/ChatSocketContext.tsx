import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessageEvent, ChatNotificationEvent } from "@therapist/shared";
import { useAuth } from "./AuthContext";
import { getAccessToken } from "../lib/api";
import { appendMessageToCache } from "../lib/chatCache";
import { isTabInBackground, showBrowserNotification } from "../lib/notifications";

export interface ChatToast {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
}

interface ChatSocketContextType {
  connected: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  toasts: ChatToast[];
  dismissToast: (id: string) => void;
}

const ChatSocketContext = createContext<ChatSocketContextType | null>(null);

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ChatToast[]>([]);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationIdState(id);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((event: ChatNotificationEvent) => {
    const toast: ChatToast = {
      id: `${event.conversationId}-${event.message.id}`,
      conversationId: event.conversationId,
      senderName: event.senderName,
      preview: event.preview,
    };
    setToasts((prev) => {
      if (prev.some((t) => t.id === toast.id)) return prev;
      return [toast, ...prev].slice(0, 5);
    });

    setTimeout(() => dismissToast(toast.id), 6000);
  }, [dismissToast]);

  useEffect(() => {
    if (!user || (user.role !== "client" && user.role !== "therapist")) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const socket = io({
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (event: ChatMessageEvent) => {
      appendMessageToCache(queryClient, event.conversationId, event.message);
    });

    socket.on("message:notification", (event: ChatNotificationEvent) => {
      appendMessageToCache(queryClient, event.conversationId, event.message);

      const isViewing = activeConversationIdRef.current === event.conversationId;
      if (!isViewing) {
        if (isTabInBackground()) {
          showBrowserNotification({
            title: `Message from ${event.senderName}`,
            body: event.preview,
            tag: `chat-${event.conversationId}`,
            onClick: () => {
              const path =
                user.role === "client" ? "/dashboard?tab=messages" : "/therapist/dashboard?tab=messages";
              window.location.href = path;
            },
          });
        } else {
          addToast(event);
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, queryClient, addToast]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return;

    socket.emit("conversation:join", activeConversationId);
    return () => {
      socket.emit("conversation:leave", activeConversationId);
    };
  }, [activeConversationId, connected]);

  return (
    <ChatSocketContext.Provider
      value={{
        connected,
        activeConversationId,
        setActiveConversationId,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) throw new Error("useChatSocket must be used within ChatSocketProvider");
  return ctx;
}

export function useOptionalChatSocket() {
  return useContext(ChatSocketContext);
}
