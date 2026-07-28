import mongoose, { Document, Schema, Types } from "mongoose";
import type { ReviewStatus } from "@therapist/shared";

export interface IReview extends Document {
  _id: Types.ObjectId;
  therapistId: Types.ObjectId;
  clientId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: "TherapistProfile", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "BookingRequest", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ["published", "hidden"], default: "published" },
  },
  { timestamps: true }
);

reviewSchema.index({ therapistId: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
