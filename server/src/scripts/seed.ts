import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User";
import { TherapistProfile } from "../models/TherapistProfile";
import { FAQ } from "../models/FAQ";
import { geocodeAddress } from "../services/geocode";

dotenv.config();

const therapists = [
  {
    email: "sarah.johnson@example.com",
    firstName: "Sarah",
    lastName: "Johnson",
    headline: "Licensed Clinical Psychologist specializing in anxiety",
    bio: "With over 12 years of experience, I help adults navigate anxiety, depression, and life transitions using evidence-based approaches including CBT and mindfulness techniques.",
    city: "New York",
    state: "NY",
    zip: "10001",
    specialties: ["Anxiety", "Depression", "CBT"],
    languages: ["English", "Spanish"],
    sessionTypes: ["in-person", "online"] as const,
    credentials: ["PhD Clinical Psychology", "Licensed Psychologist NY"],
    yearsExperience: 12,
    hourlyRate: 180,
  },
  {
    email: "michael.chen@example.com",
    firstName: "Michael",
    lastName: "Chen",
    headline: "Marriage and Family Therapist",
    bio: "I work with couples and families to improve communication, resolve conflicts, and rebuild trust. My approach is collaborative and culturally sensitive.",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    specialties: ["Couples Therapy", "Family Therapy", "Communication"],
    languages: ["English", "Mandarin"],
    sessionTypes: ["in-person", "online"] as const,
    credentials: ["LMFT", "MFT License CA"],
    yearsExperience: 8,
    hourlyRate: 160,
  },
  {
    email: "emily.rodriguez@example.com",
    firstName: "Emily",
    lastName: "Rodriguez",
    headline: "Trauma-informed therapist for teens and young adults",
    bio: "Specializing in trauma recovery, PTSD, and adolescent mental health. I create a safe, non-judgmental space for healing and growth.",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    specialties: ["Trauma", "PTSD", "Adolescent Therapy"],
    languages: ["English", "Spanish"],
    sessionTypes: ["online"] as const,
    credentials: ["LCSW", "EMDR Certified"],
    yearsExperience: 10,
    hourlyRate: 150,
  },
  {
    email: "david.williams@example.com",
    firstName: "David",
    lastName: "Williams",
    headline: "Addiction counselor and recovery specialist",
    bio: "Supporting individuals and families affected by addiction through compassionate, evidence-based treatment and long-term recovery planning.",
    city: "Houston",
    state: "TX",
    zip: "77001",
    specialties: ["Addiction", "Substance Abuse", "Recovery"],
    languages: ["English"],
    sessionTypes: ["in-person"] as const,
    credentials: ["LPC", "CADC"],
    yearsExperience: 15,
    hourlyRate: 140,
  },
  {
    email: "lisa.patel@example.com",
    firstName: "Lisa",
    lastName: "Patel",
    headline: "Child psychologist and play therapy expert",
    bio: "Helping children ages 4-12 overcome behavioral challenges, anxiety, and developmental concerns through play therapy and parent coaching.",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    specialties: ["Child Therapy", "Play Therapy", "ADHD"],
    languages: ["English", "Hindi"],
    sessionTypes: ["in-person", "online"] as const,
    credentials: ["PsyD", "Registered Play Therapist"],
    yearsExperience: 9,
    hourlyRate: 175,
  },
  {
    email: "james.martinez@example.com",
    firstName: "James",
    lastName: "Martinez",
    headline: "Grief and loss counseling specialist",
    bio: "Providing compassionate support for those navigating grief, loss, and major life changes. I believe in honoring your unique healing journey.",
    city: "Miami",
    state: "FL",
    zip: "33101",
    specialties: ["Grief Counseling", "Loss", "Life Transitions"],
    languages: ["English", "Spanish"],
    sessionTypes: ["in-person", "online"] as const,
    credentials: ["LMHC", "Grief Recovery Specialist"],
    yearsExperience: 11,
    hourlyRate: 145,
  },
];

const faqs = [
  {
    question: "How do I find the right therapist?",
    answer:
      "Browse our directory and use filters for location, specialty, and session type. Read therapist profiles and reviews to find someone who matches your needs. You can also contact us for guidance.",
    order: 1,
  },
  {
    question: "How does booking work?",
    answer:
      "Create a free client account, select a therapist, and submit a booking request with your preferred date and time. The therapist will review and confirm or decline your request.",
    order: 2,
  },
  {
    question: "Can I leave a review?",
    answer:
      "Yes! After your booking is confirmed by the therapist, you can leave a review from your client dashboard to help others make informed decisions.",
    order: 3,
  },
  {
    question: "Are online sessions available?",
    answer:
      "Many therapists on our platform offer online sessions. Use the session type filter on the directory page to find therapists who offer telehealth appointments.",
    order: 4,
  },
  {
    question: "How do therapists join the directory?",
    answer:
      "Therapists can register through our therapist signup page. All profiles are reviewed and approved by our team before appearing in the public directory.",
    order: 5,
  },
  {
    question: "Is my information kept private?",
    answer:
      "We take privacy seriously. Your personal information and booking details are kept confidential and are never shared without your consent.",
    order: 6,
  },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/therapist-directory";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    TherapistProfile.deleteMany({}),
    FAQ.deleteMany({}),
  ]);

  const adminHash = await bcrypt.hash("Admin123!", 12);
  await User.create({
    email: "admin@therapistdirectory.com",
    passwordHash: adminHash,
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isEmailVerified: true,
  });

  const clientHash = await bcrypt.hash("Client123!", 12);
  await User.create({
    email: "client@example.com",
    passwordHash: clientHash,
    firstName: "Jane",
    lastName: "Doe",
    role: "client",
    isEmailVerified: true,
  });

  for (const t of therapists) {
    const passwordHash = await bcrypt.hash("Therapist123!", 12);
    const user = await User.create({
      email: t.email,
      passwordHash,
      firstName: t.firstName,
      lastName: t.lastName,
      role: "therapist",
      isEmailVerified: true,
    });

    const coords = await geocodeAddress(t.city, t.state, t.zip);
    const slug = `${t.firstName.toLowerCase()}-${t.lastName.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;

    await TherapistProfile.create({
      userId: user._id,
      status: "approved",
      slug,
      headline: t.headline,
      bio: t.bio,
      credentials: t.credentials,
      specialties: t.specialties,
      languages: t.languages,
      sessionTypes: [...t.sessionTypes],
      yearsExperience: t.yearsExperience,
      hourlyRate: t.hourlyRate,
      approvedAt: new Date(),
      location: {
        city: t.city,
        state: t.state,
        country: "USA",
        zip: t.zip,
        ...(coords
          ? { coordinates: { type: "Point" as const, coordinates: coords } }
          : {}),
      },
    });
  }

  await FAQ.insertMany(faqs.map((f) => ({ ...f, isPublished: true })));

  console.log("Seed completed!");
  console.log("Admin: admin@therapistdirectory.com / Admin123!");
  console.log("Client: client@example.com / Client123!");
  console.log("Therapists: *@example.com / Therapist123!");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
