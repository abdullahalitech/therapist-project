export type UserRole = "client" | "therapist" | "admin";

export type TherapistStatus = "pending" | "approved" | "rejected" | "suspended";

export type SessionType = "in-person" | "online";

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export type ReviewStatus = "published" | "hidden";

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  zip: string;
  address?: string;
  coordinates?: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface TherapistProfilePublic {
  id: string;
  slug: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  credentials: string[];
  specialties: string[];
  languages: string[];
  sessionTypes: SessionType[];
  location: Location;
  profileImageUrl?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  averageRating: number;
  reviewCount: number;
  status: TherapistStatus;
}

export interface ReviewPublic {
  id: string;
  rating: number;
  title: string;
  body: string;
  clientFirstName: string;
  clientLastName: string;
  createdAt: string;
}

export interface BookingPublic {
  id: string;
  therapistId: string;
  therapistName: string;
  therapistSlug: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: BookingStatus;
  therapistResponseNote?: string;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  hasReview?: boolean;
  needsReview?: boolean;
}

export interface FAQPublic {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
