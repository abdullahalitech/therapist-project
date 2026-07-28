import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  therapistId: Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
    lastMessageAt: Date,
    lastMessagePreview: String,
  },
  { timestamps: true }
);

conversationSchema.index({ clientId: 1, therapistId: 1 }, { unique: true });
conversationSchema.index({ clientId: 1, lastMessageAt: -1 });
conversationSchema.index({ therapistId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
