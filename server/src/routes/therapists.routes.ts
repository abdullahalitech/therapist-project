import { Router } from "express";
import mongoose from "mongoose";
import { therapistListQuerySchema } from "@therapist/shared";
import { TherapistProfile } from "../models/TherapistProfile";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { validateQuery } from "../middleware/validate";
import { toTherapistPublic } from "../utils/serializers";
import { getBookedSlotsForDate } from "../utils/bookingOverlap";

const router = Router();

router.get("/", validateQuery(therapistListQuerySchema), async (req, res) => {
  const query = req.query as unknown as ReturnType<typeof therapistListQuerySchema.parse>;
  const filter: Record<string, unknown> = { status: "approved" };

  if (query.city) {
    filter["location.city"] = { $regex: query.city, $options: "i" };
  }
  if (query.state) {
    filter["location.state"] = { $regex: query.state, $options: "i" };
  }
  if (query.specialty) {
    filter.specialties = query.specialty;
  }
  if (query.sessionType) {
    filter.sessionTypes = query.sessionType;
  }
  if (query.minRating) {
    filter.averageRating = { $gte: query.minRating };
  }

  if (query.q) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: query.q, $options: "i" } },
        { lastName: { $regex: query.q, $options: "i" } },
      ],
      role: "therapist",
    }).select("_id");
    const userIds = users.map((u) => u._id);
    filter.$or = [
      { userId: { $in: userIds } },
      { headline: { $regex: query.q, $options: "i" } },
      { bio: { $regex: query.q, $options: "i" } },
      { specialties: { $regex: query.q, $options: "i" } },
    ];
  }

  let sort: Record<string, 1 | -1> = { averageRating: -1 };
  if (query.sort === "newest") sort = { createdAt: -1 };
  if (query.sort === "name") sort = { slug: 1 };

  const skip = (query.page - 1) * query.limit;

  if (query.lat !== undefined && query.lng !== undefined && query.radiusKm) {
    const radiusMeters = query.radiusKm * 1000;
    const geoFilter = {
      ...filter,
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [[query.lng, query.lat], radiusMeters / 6378100],
        },
      },
    };

    const [profiles, total] = await Promise.all([
      TherapistProfile.find(geoFilter).sort(sort).skip(skip).limit(query.limit),
      TherapistProfile.countDocuments(geoFilter),
    ]);

    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    res.json({
      data: profiles.map((p) => toTherapistPublic(p, userMap.get(p.userId.toString())!)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
    return;
  }

  const [profiles, total] = await Promise.all([
    TherapistProfile.find(filter).sort(sort).skip(skip).limit(query.limit),
    TherapistProfile.countDocuments(filter),
  ]);

  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  res.json({
    data: profiles
      .filter((p) => userMap.has(p.userId.toString()))
      .map((p) => toTherapistPublic(p, userMap.get(p.userId.toString())!)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  });
});

router.get("/featured", async (_req, res) => {
  const profiles = await TherapistProfile.find({ status: "approved" })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(6);

  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  res.json(
    profiles
      .filter((p) => userMap.has(p.userId.toString()))
      .map((p) => toTherapistPublic(p, userMap.get(p.userId.toString())!))
  );
});

router.get("/specialties/list", async (_req, res) => {
  const specialties = await TherapistProfile.distinct("specialties", { status: "approved" });
  res.json(specialties.sort());
});

router.get("/:slug/availability", async (req, res) => {
  const dateStr = req.query.date as string;
  if (!dateStr) {
    res.status(400).json({ error: "date query parameter is required (YYYY-MM-DD)" });
    return;
  }

  const profile = await TherapistProfile.findOne({
    slug: req.params.slug,
    status: "approved",
  });

  if (!profile) {
    res.status(404).json({ error: "Therapist not found" });
    return;
  }

  const bookedSlots = await getBookedSlotsForDate(profile._id, new Date(dateStr));
  res.json({ date: dateStr, bookedSlots });
});

router.get("/:slug", async (req, res) => {
  const profile = await TherapistProfile.findOne({
    slug: req.params.slug,
    status: "approved",
  });

  if (!profile) {
    res.status(404).json({ error: "Therapist not found" });
    return;
  }

  const user = await User.findById(profile.userId);
  if (!user) {
    res.status(404).json({ error: "Therapist not found" });
    return;
  }

  res.json(toTherapistPublic(profile, user));
});

router.get("/:slug/reviews", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

  const profile = await TherapistProfile.findOne({
    slug: req.params.slug,
    status: "approved",
  });

  if (!profile) {
    res.status(404).json({ error: "Therapist not found" });
    return;
  }

  const filter = {
    therapistId: profile._id,
    status: "published" as const,
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("clientId", "firstName lastName"),
    Review.countDocuments(filter),
  ]);

  res.json({
    data: reviews.map((r) => {
      const client = r.clientId as unknown as { firstName: string; lastName: string; _id: mongoose.Types.ObjectId };
      return {
        id: r._id.toString(),
        rating: r.rating,
        title: r.title,
        body: r.body,
        clientFirstName: client.firstName,
        clientLastName: client.lastName.charAt(0) + ".",
        createdAt: r.createdAt.toISOString(),
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
