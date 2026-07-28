import { Types } from "mongoose";
import { BookingRequest } from "../models/BookingRequest";
import { Conversation, IConversation } from "../models/Conversation";
import { TherapistProfile } from "../models/TherapistProfile";
import { IUser } from "../models/User";

const CHAT_ELIGIBLE_STATUSES = ["confirmed", "completed"] as const;

export async function hasChatAccess(
  clientId: Types.ObjectId | string,
  therapistProfileId: Types.ObjectId | string
): Promise<boolean> {
  const booking = await BookingRequest.findOne({
    clientId,
    therapistId: therapistProfileId,
    status: { $in: CHAT_ELIGIBLE_STATUSES },
  }).select("_id");

  return !!booking;
}

export async function getConversationForUser(
  conversationId: string,
  user: IUser
): Promise<IConversation | null> {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  if (user.role === "client") {
    if (conversation.clientId.toString() !== user._id.toString()) return null;
    return conversation;
  }

  if (user.role === "therapist") {
    const profile = await TherapistProfile.findOne({ userId: user._id });
    if (!profile || conversation.therapistId.toString() !== profile._id.toString()) {
      return null;
    }
    return conversation;
  }

  return null;
}
