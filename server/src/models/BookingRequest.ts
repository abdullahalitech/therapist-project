import mongoose, { Document, Schema, Types } from "mongoose";
import type { BookingStatus } from "@therapist/shared";

export interface IBookingRequest extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  therapistId: Types.ObjectId;
  preferredDate: Date;
  preferredTime: string;
  message?: string;
  status: BookingStatus;
  therapistResponseNote?: string;
  confirmedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingRequestSchema = new Schema<IBookingRequest>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    message: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed"],
      default: "pending",
    },
    therapistResponseNote: String,
    confirmedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

bookingRequestSchema.index({ clientId: 1, createdAt: -1 });
bookingRequestSchema.index({ therapistId: 1, status: 1, createdAt: -1 });
bookingRequestSchema.index({ therapistId: 1, preferredDate: 1, preferredTime: 1, status: 1 });

export const BookingRequest = mongoose.model<IBookingRequest>(
  "BookingRequest",
  bookingRequestSchema
);
