import { Router, Response } from "express";
import {
  createConversationSchema,
  sendMessageSchema,
  messagesQuerySchema,
} from "@therapist/shared";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { BookingRequest } from "../models/BookingRequest";
import { TherapistProfile } from "../models/TherapistProfile";
import { User } from "../models/User";
import { validateBody, validateQuery } from "../middleware/validate";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import { getConversationForUser, hasChatAccess } from "../utils/chatAccess";
import { emitNewMessage, isUserOnline } from "../services/chatRealtime";
import { sendEmail, newMessageEmail } from "../services/email";
import { config } from "../config";
import type { ConversationPublic, MessagePublic } from "@therapist/shared";

const router = Router();

router.use(authenticate, requireRole("client", "therapist"));

async function serializeConversation(
  conversation: InstanceType<typeof Conversation>,
  userId: string,
  userRole: "client" | "therapist"
): Promise<ConversationPublic> {
  let otherPartyName = "Unknown";

  if (userRole === "client") {
    const profile = await TherapistProfile.findById(conversation.therapistId).populate(
      "userId",
      "firstName lastName"
    );
    const therapistUser = profile?.userId as unknown as { firstName: string; lastName: string } | undefined;
    if (therapistUser) {
      otherPartyName = `${therapistUser.firstName} ${therapistUser.lastName}`;
    }
  } else {
    const client = await User.findById(conversation.clientId).select("firstName lastName");
    if (client) {
      otherPartyName = `${client.firstName} ${client.lastName}`;
    }
  }

  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    senderId: { $ne: userId },
    readAt: { $exists: false },
  });

  return {
    id: conversation._id.toString(),
    clientId: conversation.clientId.toString(),
    therapistId: conversation.therapistId.toString(),
    otherPartyName,
    lastMessagePreview: conversation.lastMessagePreview,
    lastMessageAt: conversation.lastMessageAt?.toISOString(),
    unreadCount,
    createdAt: conversation.createdAt.toISOString(),
  };
}

function serializeMessage(
  message: InstanceType<typeof Message>,
  senderName: string,
  currentUserId: string
): MessagePublic {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId.toString(),
    senderName,
    body: message.body,
    isOwn: message.senderId.toString() === currentUserId,
    readAt: message.readAt?.toISOString(),
    createdAt: message.createdAt.toISOString(),
  };
}

router.get("/", async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  let conversations;
  if (user.role === "client") {
    conversations = await Conversation.find({ clientId: user._id }).sort({
      lastMessageAt: -1,
      createdAt: -1,
    });
  } else {
    const profile = await TherapistProfile.findOne({ userId: user._id });
    if (!profile) {
      res.status(404).json({ error: "Therapist profile not found" });
      return;
    }
    conversations = await Conversation.find({ therapistId: profile._id }).sort({
      lastMessageAt: -1,
      createdAt: -1,
    });
  }

  const data = await Promise.all(
    conversations.map((c) =>
      serializeConversation(c, user._id.toString(), user.role as "client" | "therapist")
    )
  );

  res.json(data);
});

router.post(
  "/",
  validateBody(createConversationSchema),
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { therapistId, clientId } = req.body;

    let resolvedClientId: string;
    let resolvedTherapistId: string;

    if (user.role === "client") {
      if (!therapistId) {
        res.status(400).json({ error: "therapistId is required" });
        return;
      }
      const profile = await TherapistProfile.findOne({ _id: therapistId, status: "approved" });
      if (!profile) {
        res.status(404).json({ error: "Therapist not found" });
        return;
      }
      resolvedClientId = user._id.toString();
      resolvedTherapistId = profile._id.toString();
    } else {
      if (!clientId) {
        res.status(400).json({ error: "clientId is required" });
        return;
      }
      const profile = await TherapistProfile.findOne({ userId: user._id });
      if (!profile) {
        res.status(404).json({ error: "Therapist profile not found" });
        return;
      }
      resolvedClientId = clientId;
      resolvedTherapistId = profile._id.toString();
    }

    const eligible = await hasChatAccess(resolvedClientId, resolvedTherapistId);
    if (!eligible) {
      res.status(403).json({
        error: "Messaging is available after a booking is confirmed",
      });
      return;
    }

    let conversation = await Conversation.findOne({
      clientId: resolvedClientId,
      therapistId: resolvedTherapistId,
    });

    const isNew = !conversation;

    if (!conversation) {
      conversation = await Conversation.create({
        clientId: resolvedClientId,
        therapistId: resolvedTherapistId,
      });
    }

    const data = await serializeConversation(
      conversation,
      user._id.toString(),
      user.role as "client" | "therapist"
    );

    res.status(isNew ? 201 : 200).json(data);
  }
);

router.get(
  "/eligible",
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;

    if (user.role === "client") {
      const bookings = await BookingRequest.find({
        clientId: user._id,
        status: { $in: ["confirmed", "completed"] },
      }).populate({ path: "therapistId", populate: { path: "userId", select: "firstName lastName" } });

      const seen = new Set<string>();
      const contacts = bookings
        .filter((b) => {
          const id = (b.therapistId as unknown as { _id: { toString(): string } })._id.toString();
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map((b) => {
          const profile = b.therapistId as unknown as {
            _id: { toString(): string };
            userId: { firstName: string; lastName: string };
          };
          return {
            therapistId: profile._id.toString(),
            name: `${profile.userId.firstName} ${profile.userId.lastName}`,
          };
        });

      res.json(contacts);
      return;
    }

    const profile = await TherapistProfile.findOne({ userId: user._id });
    if (!profile) {
      res.status(404).json({ error: "Therapist profile not found" });
      return;
    }

    const bookings = await BookingRequest.find({
      therapistId: profile._id,
      status: { $in: ["confirmed", "completed"] },
    }).populate("clientId", "firstName lastName");

    const seen = new Set<string>();
    const contacts = bookings
      .filter((b) => {
        const id = (b.clientId as unknown as { _id: { toString(): string } })._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((b) => {
        const client = b.clientId as unknown as {
          _id: { toString(): string };
          firstName: string;
          lastName: string;
        };
        return {
          clientId: client._id.toString(),
          name: `${client.firstName} ${client.lastName}`,
        };
      });

    res.json(contacts);
  }
);

router.get(
  "/:id/messages",
  validateQuery(messagesQuerySchema),
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const conversation = await getConversationForUser(String(req.params.id), user);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { before, limit } = req.query as unknown as { before?: string; limit: number };

    const filter: Record<string, unknown> = { conversationId: conversation._id };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "firstName lastName");

    const data = messages.reverse().map((m) => {
      const sender = m.senderId as unknown as { firstName: string; lastName: string; _id: { toString(): string } };
      return serializeMessage(
        m,
        `${sender.firstName} ${sender.lastName}`,
        user._id.toString()
      );
    });

    res.json(data);
  }
);

router.post(
  "/:id/messages",
  validateBody(sendMessageSchema),
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const conversation = await getConversationForUser(String(req.params.id), user);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const eligible = await hasChatAccess(conversation.clientId, conversation.therapistId);
    if (!eligible) {
      res.status(403).json({ error: "Messaging is no longer available for this relationship" });
      return;
    }

    const { body } = req.body;

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: user._id,
      body: body.trim(),
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview =
      body.trim().length > 80 ? `${body.trim().slice(0, 80)}…` : body.trim();
    await conversation.save();

    const data = serializeMessage(
      message,
      `${user.firstName} ${user.lastName}`,
      user._id.toString()
    );

    const therapistProfile = await TherapistProfile.findById(conversation.therapistId);
    if (therapistProfile) {
      const recipientUserId =
        user._id.toString() === conversation.clientId.toString()
          ? therapistProfile.userId.toString()
          : conversation.clientId.toString();

      const senderName = `${user.firstName} ${user.lastName}`;

      emitNewMessage({
        conversationId: conversation._id.toString(),
        recipientUserId,
        message: data,
        senderName,
      });

      if (!isUserOnline(recipientUserId)) {
        const recipient = await User.findById(recipientUserId);
        if (recipient) {
          const messagesUrl =
            recipient.role === "client"
              ? `${config.clientUrl}/dashboard?tab=messages`
              : `${config.clientUrl}/therapist/dashboard?tab=messages`;

          void sendEmail({
            to: recipient.email,
            subject: `New message from ${senderName}`,
            html: newMessageEmail({
              recipientName: recipient.firstName,
              senderName,
              preview: data.body,
              messagesUrl,
            }),
          });
        }
      }
    }

    res.status(201).json(data);
  }
);

router.patch("/:id/read", async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const conversation = await getConversationForUser(String(req.params.id), user);

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const result = await Message.updateMany(
    {
      conversationId: conversation._id,
      senderId: { $ne: user._id },
      readAt: { $exists: false },
    },
    { $set: { readAt: new Date() } }
  );

  res.json({ message: "Marked as read", count: result.modifiedCount });
});

export default router;
