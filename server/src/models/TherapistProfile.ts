import mongoose, { Document, Schema, Types } from "mongoose";
import type { SessionType, TherapistStatus } from "@therapist/shared";

export interface ITherapistProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: TherapistStatus;
  slug: string;
  headline: string;
  bio: string;
  credentials: string[];
  specialties: string[];
  languages: string[];
  sessionTypes: SessionType[];
  location: {
    city: string;
    state: string;
    country: string;
    zip: string;
    address?: string;
    coordinates?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  profileImageUrl?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  averageRating: number;
  reviewCount: number;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const therapistProfileSchema = new Schema<ITherapistProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    headline: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    credentials: [{ type: String }],
    specialties: [{ type: String, required: true }],
    languages: [{ type: String, required: true }],
    sessionTypes: [{ type: String, enum: ["in-person", "online"], required: true }],
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: "USA" },
      zip: { type: String, required: true },
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"] },
        coordinates: { type: [Number] },
      },
    },
    profileImageUrl: String,
    yearsExperience: Number,
    hourlyRate: Number,
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

therapistProfileSchema.pre("save", function (next) {
  const coords = this.location?.coordinates;
  if (coords && (!coords.coordinates || coords.coordinates.length !== 2)) {
    this.location.coordinates = undefined;
  }
  next();
});

therapistProfileSchema.index({ "location.coordinates": "2dsphere" }, { sparse: true });
therapistProfileSchema.index({ status: 1, averageRating: -1 });
therapistProfileSchema.index({ specialties: 1 });
therapistProfileSchema.index({ "location.city": 1, "location.state": 1 });

export const TherapistProfile = mongoose.model<ITherapistProfile>(
  "TherapistProfile",
  therapistProfileSchema
);
