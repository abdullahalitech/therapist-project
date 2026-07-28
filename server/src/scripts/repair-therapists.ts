import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User";
import { TherapistProfile } from "../models/TherapistProfile";
import { generateUniqueSlug } from "../utils/serializers";

dotenv.config();

async function repairOrphanedTherapists() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/therapist-directory";
  await mongoose.connect(uri);

  const therapists = await User.find({ role: "therapist" });

  for (const user of therapists) {
    const existing = await TherapistProfile.findOne({ userId: user._id });
    if (existing) {
      console.log(`OK: ${user.firstName} ${user.lastName} (${existing.status})`);
      continue;
    }

    const slug = generateUniqueSlug(user.firstName, user.lastName);
    await TherapistProfile.create({
      userId: user._id,
      slug,
      status: "pending",
      headline: "Licensed Therapist",
      bio: "Professional therapist profile pending completion. Please update your bio from the therapist dashboard.",
      credentials: [],
      specialties: ["General Counseling"],
      languages: ["English"],
      sessionTypes: ["online", "in-person"],
      location: {
        city: "New York",
        state: "NY",
        country: "USA",
        zip: "10001",
      },
    });

    console.log(`REPAIRED: ${user.firstName} ${user.lastName} (${user.email})`);
  }

  await mongoose.disconnect();
}

repairOrphanedTherapists().catch(console.error);
