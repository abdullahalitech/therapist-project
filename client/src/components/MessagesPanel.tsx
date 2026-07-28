import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { api } from "../lib/api";
import { appendMessageToCache } from "../lib/chatCache";
import { useChatSocket } from "../context/ChatSocketContext";
import type { ConversationPublic, MessagePublic } from "@therapist/shared";
import { cn } from "../lib/utils";

function formatMessageTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface MessagesPanelProps {
  role: "client" | "therapist";
  initialTherapistId?: string;
  initialClientId?: string;
}

export function MessagesPanel({ role, initialTherapistId, initialClientId }: MessagesPanelProps) {
  const queryClient = useQueryClient();
  const { connected, setActiveConversationId } = useChatSocket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const initializedRef = useRef(false);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.getConversations,
  });

  const { data: eligibleContacts = [] } = useQuery({
    queryKey: ["eligible-contacts"],
    queryFn: api.getEligibleContacts,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: () => api.getMessages(selectedId!),
    enabled: !!selectedId,
  });

  const startConversation = useMutation({
    mutationFn: (body: { therapistId?: string; clientId?: string }) =>
      api.createConversation(body),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedId(conversation.id);
      setMobileShowThread(true);
    },
  });

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      api.sendMessage(conversationId, body),
    onSuccess: (message) => {
      setDraft("");
      setSendError("");
      if (selectedId) {
        appendMessageToCache(queryClient, selectedId, message);
      }
    },
    onError: (err: Error) => setSendError(err.message),
  });

  useEffect(() => {
    setActiveConversationId(selectedId);
    return () => setActiveConversationId(null);
  }, [selectedId, setActiveConversationId]);

  useEffect(() => {
    if (initializedRef.current || loadingConversations) return;
    if (!initialTherapistId && !initialClientId) return;

    if (initialTherapistId && role === "client") {
      initializedRef.current = true;
      const existing = conversations.find((c) => c.therapistId === initialTherapistId);
      if (existing) {
        setSelectedId(existing.id);
        setMobileShowThread(true);
      } else {
        startConversation.mutate({ therapistId: initialTherapistId });
      }
      return;
    }

    if (initialClientId && role === "therapist") {
      initializedRef.current = true;
      const existing = conversations.find((c) => c.clientId === initialClientId);
      if (existing) {
        setSelectedId(existing.id);
        setMobileShowThread(true);
      } else {
        startConversation.mutate({ clientId: initialClientId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, loadingConversations, initialTherapistId, initialClientId, role]);

  useEffect(() => {
    if (selectedId) {
      api.markConversationRead(selectedId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
    }
  }, [selectedId, messages.length, queryClient]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const existingContactIds = new Set(
    conversations.map((c) => (role === "client" ? c.therapistId : c.clientId))
  );

  const newContacts = eligibleContacts.filter((contact) => {
    const id = "therapistId" in contact ? contact.therapistId : contact.clientId;
    return !existingContactIds.has(id);
  });

  const handleSelect = (conversation: ConversationPublic) => {
    setSelectedId(conversation.id);
    setMobileShowThread(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId) return;
    sendMessage.mutate({ conversationId: selectedId, body });
  };

  const handleStartNew = (contact: { therapistId?: string; clientId?: string }) => {
    startConversation.mutate(contact);
  };

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex h-[32rem] flex-col md:flex-row">
        {/* Conversation list */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-slate-200 md:w-72 lg:w-80",
            mobileShowThread && selectedId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Messages</h2>
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                connected ? "text-green-600" : "text-slate-400"
              )}
              title={connected ? "Connected — messages arrive instantly" : "Reconnecting…"}
            >
              {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {connected ? "Live" : "Offline"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              </div>
            ) : conversations.length === 0 && newContacts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2">No conversations yet</p>
                <p className="mt-1 text-xs">
                  Messaging opens after a booking is confirmed
                </p>
              </div>
            ) : (
              <>
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50",
                      selectedId === c.id && "bg-primary-50"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {c.otherPartyName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-slate-900">{c.otherPartyName}</p>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {c.lastMessagePreview && (
                        <p className="truncate text-sm text-slate-500">{c.lastMessagePreview}</p>
                      )}
                      {c.lastMessageAt && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatMessageTime(c.lastMessageAt)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}

                {newContacts.length > 0 && (
                  <div className="border-t border-slate-200 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Start a conversation
                    </p>
                    {newContacts.map((contact) => {
                      const id = "therapistId" in contact ? contact.therapistId : contact.clientId;
                      return (
                        <button
                          key={id}
                          onClick={() =>
                            handleStartNew(
                              "therapistId" in contact
                                ? { therapistId: contact.therapistId }
                                : { clientId: contact.clientId }
                            )
                          }
                          disabled={startConversation.isPending}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="font-medium text-primary-700">{contact.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat thread */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            !mobileShowThread || !selectedId ? "hidden md:flex" : "flex"
          )}
        >
          {selectedId && selectedConversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button
                  onClick={() => setMobileShowThread(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {selectedConversation.otherPartyName.charAt(0)}
                </div>
                <p className="font-semibold text-slate-900">{selectedConversation.otherPartyName}</p>
              </div>

              <MessageList messages={messages} loading={loadingMessages} />

              {sendError && (
                <div className="mx-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {sendError}
                </div>
              )}

              <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sendMessage.isPending}
                  className="btn-primary shrink-0 px-4"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
              <MessageCircle className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageList({ messages, loading }: { messages: MessagePublic[]; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCountRef.current = messages.length;
    }
  }, [messages.length]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div key={m.id} className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
              m.isOwn
                ? "rounded-br-md bg-primary-600 text-white"
                : "rounded-bl-md bg-slate-100 text-slate-800"
            )}
          >
            {!m.isOwn && (
              <p className="mb-0.5 text-xs font-medium text-slate-500">{m.senderName}</p>
            )}
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p
              className={cn(
                "mt-1 text-right text-xs",
                m.isOwn ? "text-primary-200" : "text-slate-400"
              )}
            >
              {formatMessageTime(m.createdAt)}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
