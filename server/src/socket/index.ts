import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../config";
import { verifyAccessToken } from "../middleware/auth";
import { User } from "../models/User";
import { getConversationForUser } from "../utils/chatAccess";
import { trackUserConnection } from "../services/chatRealtime";

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        next(new Error("Authentication required"));
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      if (!user) {
        next(new Error("User not found"));
        return;
      }

      if (user.role !== "client" && user.role !== "therapist") {
        next(new Error("Chat not available for this role"));
        return;
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    socket.join(`user:${userId}`);
    trackUserConnection(userId, true);

    socket.on("conversation:join", async (conversationId: string) => {
      if (typeof conversationId !== "string") return;
      const conversation = await getConversationForUser(conversationId, user);
      if (conversation) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("conversation:leave", (conversationId: string) => {
      if (typeof conversationId !== "string") return;
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      trackUserConnection(userId, false);
    });
  });

  return io;
}
