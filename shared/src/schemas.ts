import { z } from "zod";

export const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export const registerTherapistSchema = registerClientSchema.extend({
  headline: z.string().min(1),
  bio: z.string().min(20),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default("USA"),
  zip: z.string().min(1),
  address: z.string().optional(),
  specialties: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  sessionTypes: z.array(z.enum(["in-person", "online"])).min(1),
  credentials: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
});

export const bookingSchema = z.object({
  therapistId: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  message: z.string().optional(),
});

export const bookingFormSchema = bookingSchema.omit({ therapistId: true });

export const bookingResponseSchema = z.object({
  status: z.enum(["confirmed", "declined", "cancelled", "completed"]),
  therapistResponseNote: z.string().optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1),
  body: z.string().min(10),
});

export const updateTherapistProfileSchema = z.object({
  headline: z.string().min(1).optional(),
  bio: z.string().min(20).optional(),
  credentials: z.array(z.string()).optional(),
  specialties: z.array(z.string()).min(1).optional(),
  languages: z.array(z.string()).min(1).optional(),
  sessionTypes: z.array(z.enum(["in-person", "online"])).min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().optional(),
  zip: z.string().min(1).optional(),
  address: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export const therapistListQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  specialty: z.string().optional(),
  sessionType: z.enum(["in-person", "online"]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["rating", "newest", "name"]).default("rating"),
});
