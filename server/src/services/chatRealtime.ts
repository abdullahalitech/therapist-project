import { Server } from "socket.io";
import type { MessagePublic } from "@therapist/shared";

let io: Server | null = null;
const onlineUsers = new Set<string>();

export function setChatIo(server: Server): void {
  io = server;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function trackUserConnection(userId: string, connected: boolean): void {
  if (connected) {
    onlineUsers.add(userId);
  } else {
    onlineUsers.delete(userId);
  }
}

export function emitNewMessage(params: {
  conversationId: string;
  recipientUserId: string;
  message: MessagePublic;
  senderName: string;
}): void {
  if (!io) return;

  const preview =
    params.message.body.length > 80
      ? `${params.message.body.slice(0, 80)}…`
      : params.message.body;

  io.to(`conversation:${params.conversationId}`).emit("message:new", {
    conversationId: params.conversationId,
    message: params.message,
  });

  io.to(`user:${params.recipientUserId}`).emit("message:notification", {
    conversationId: params.conversationId,
    message: params.message,
    senderName: params.senderName,
    preview,
  });
}
