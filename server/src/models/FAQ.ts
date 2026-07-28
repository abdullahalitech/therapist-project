import mongoose, { Document, Schema } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FAQ = mongoose.model<IFAQ>("FAQ", faqSchema);
