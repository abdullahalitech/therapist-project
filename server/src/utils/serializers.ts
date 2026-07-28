import slugify from "slugify";
import { IUser } from "../models/User";
import { ITherapistProfile } from "../models/TherapistProfile";
import type { UserPublic, TherapistProfilePublic } from "@therapist/shared";

export function toUserPublic(user: IUser): UserPublic {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

export function toTherapistPublic(
  profile: ITherapistProfile,
  user: IUser
): TherapistProfilePublic {
  return {
    id: profile._id.toString(),
    slug: profile.slug,
    userId: profile.userId.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    headline: profile.headline,
    bio: profile.bio,
    credentials: profile.credentials,
    specialties: profile.specialties,
    languages: profile.languages,
    sessionTypes: profile.sessionTypes,
    location: profile.location,
    profileImageUrl: profile.profileImageUrl,
    yearsExperience: profile.yearsExperience,
    hourlyRate: profile.hourlyRate,
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    status: profile.status,
  };
}

export function generateUniqueSlug(firstName: string, lastName: string): string {
  const base = slugify(`${firstName}-${lastName}`, { lower: true, strict: true });
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function updateTherapistRating(therapistId: string): Promise<void> {
  const mongoose = await import("mongoose");
  const { Review } = await import("../models/Review");
  const { TherapistProfile } = await import("../models/TherapistProfile");

  const stats = await Review.aggregate([
    { $match: { therapistId: new mongoose.Types.ObjectId(therapistId), status: "published" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating ?? 0;
  const reviewCount = stats[0]?.reviewCount ?? 0;

  await TherapistProfile.findByIdAndUpdate(therapistId, {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
  });
}
