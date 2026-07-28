import { Router, Response } from "express";
import { faqSchema } from "@therapist/shared";
import { TherapistProfile } from "../models/TherapistProfile";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { FAQ } from "../models/FAQ";
import { ContactMessage } from "../models/ContactMessage";
import { BookingRequest } from "../models/BookingRequest";
import { validateBody } from "../middleware/validate";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import { toTherapistPublic } from "../utils/serializers";
import { sendEmail, therapistApprovedEmail } from "../services/email";
import { updateTherapistRating } from "../utils/serializers";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/therapists/pending", async (_req, res) => {
  const profiles = await TherapistProfile.find({ status: "pending" }).sort({
    createdAt: -1,
  });
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  res.json(
    profiles
      .filter((p) => userMap.has(p.userId.toString()))
      .map((p) => toTherapistPublic(p, userMap.get(p.userId.toString())!))
  );
});

router.get("/therapists/all", async (_req, res) => {
  const profiles = await TherapistProfile.find().sort({ createdAt: -1 });
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  res.json(
    profiles
      .filter((p) => userMap.has(p.userId.toString()))
      .map((p) => toTherapistPublic(p, userMap.get(p.userId.toString())!))
  );
});

router.patch("/therapists/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await TherapistProfile.findById(req.params.id);
    if (!profile) {
      res.status(404).json({ error: "Therapist not found" });
      return;
    }

    profile.status = "approved";
    profile.approvedAt = new Date();
    profile.approvedBy = req.user!._id;
    await profile.save();

    const user = await User.findById(profile.userId);
    if (user) {
      void sendEmail({
        to: user.email,
        subject: "Profile Approved",
        html: therapistApprovedEmail({ name: user.firstName }),
      });
    }

    res.json({ message: "Therapist approved" });
  } catch (err) {
    console.error("Approve therapist failed:", err);
    res.status(500).json({ error: "Failed to approve therapist" });
  }
});

router.patch("/therapists/:id/reject", async (req, res) => {
  const profile = await TherapistProfile.findById(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "Therapist not found" });
    return;
  }

  profile.status = "rejected";
  await profile.save();
  res.json({ message: "Therapist rejected" });
});

router.get("/reviews", async (_req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .populate("clientId", "firstName lastName")
    .populate({ path: "therapistId", populate: { path: "userId", select: "firstName lastName" } });

  res.json(
    reviews.map((r) => {
      const client = r.clientId as unknown as { firstName: string; lastName: string };
      const profile = r.therapistId as unknown as {
        slug: string;
        userId: { firstName: string; lastName: string };
      };
      return {
        id: r._id.toString(),
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        clientName: `${client.firstName} ${client.lastName}`,
        therapistName: `${profile.userId.firstName} ${profile.userId.lastName}`,
        therapistSlug: profile.slug,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );
});

router.patch("/reviews/:id/hide", async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  review.status = "hidden";
  await review.save();
  await updateTherapistRating(review.therapistId.toString());
  res.json({ message: "Review hidden" });
});

router.patch("/reviews/:id/publish", async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  review.status = "published";
  await review.save();
  await updateTherapistRating(review.therapistId.toString());
  res.json({ message: "Review published" });
});

router.get("/faqs", async (_req, res) => {
  const faqs = await FAQ.find().sort({ order: 1 });
  res.json(faqs);
});

router.post("/faqs", validateBody(faqSchema), async (req, res) => {
  const faq = await FAQ.create(req.body);
  res.status(201).json(faq);
});

router.put("/faqs/:id", validateBody(faqSchema), async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) {
    res.status(404).json({ error: "FAQ not found" });
    return;
  }
  res.json(faq);
});

router.delete("/faqs/:id", async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ message: "FAQ deleted" });
});

router.get("/contact-messages", async (_req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json(messages);
});

router.patch("/contact-messages/:id/read", async (req, res) => {
  await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: "Marked as read" });
});

router.get("/bookings", async (_req, res) => {
  const bookings = await BookingRequest.find()
    .sort({ createdAt: -1 })
    .populate("clientId", "firstName lastName email")
    .populate({ path: "therapistId", populate: { path: "userId", select: "firstName lastName" } });

  res.json(
    bookings.map((b) => {
      const client = b.clientId as unknown as { firstName: string; lastName: string; email: string };
      const profile = b.therapistId as unknown as {
        slug: string;
        userId: { firstName: string; lastName: string };
      };
      return {
        id: b._id.toString(),
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        therapistName: `${profile.userId.firstName} ${profile.userId.lastName}`,
        therapistSlug: profile.slug,
        preferredDate: b.preferredDate.toISOString(),
        preferredTime: b.preferredTime,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      };
    })
  );
});

export default router;
