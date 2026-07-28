import { Router, Response } from "express";
import path from "path";
import { updateTherapistProfileSchema } from "@therapist/shared";
import { TherapistProfile } from "../models/TherapistProfile";
import { User } from "../models/User";
import { validateBody } from "../middleware/validate";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { toTherapistPublic } from "../utils/serializers";
import { geocodeAddress } from "../services/geocode";

const router = Router();

router.get(
  "/profile",
  authenticate,
  requireRole("therapist"),
  async (req: AuthRequest, res: Response) => {
    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(toTherapistPublic(profile, req.user!));
  }
);

router.put(
  "/profile",
  authenticate,
  requireRole("therapist"),
  validateBody(updateTherapistProfileSchema),
  async (req: AuthRequest, res: Response) => {
    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const data = req.body;
    if (data.headline) profile.headline = data.headline;
    if (data.bio) profile.bio = data.bio;
    if (data.credentials) profile.credentials = data.credentials;
    if (data.specialties) profile.specialties = data.specialties;
    if (data.languages) profile.languages = data.languages;
    if (data.sessionTypes) profile.sessionTypes = data.sessionTypes;
    if (data.yearsExperience !== undefined) profile.yearsExperience = data.yearsExperience;
    if (data.hourlyRate !== undefined) profile.hourlyRate = data.hourlyRate;

    const locationChanged =
      data.city || data.state || data.zip || data.country || data.address;
    if (locationChanged) {
      if (data.city) profile.location.city = data.city;
      if (data.state) profile.location.state = data.state;
      if (data.country) profile.location.country = data.country;
      if (data.zip) profile.location.zip = data.zip;
      if (data.address !== undefined) profile.location.address = data.address;

      const coords = await geocodeAddress(
        profile.location.city,
        profile.location.state,
        profile.location.zip,
        profile.location.country
      );
      if (coords) {
        profile.location.coordinates = { type: "Point", coordinates: coords };
      } else {
        profile.location.coordinates = undefined;
      }
    }

    await profile.save();
    res.json(toTherapistPublic(profile, req.user!));
  }
);

router.post(
  "/profile/image",
  authenticate,
  requireRole("therapist"),
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No image uploaded" });
      return;
    }

    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    profile.profileImageUrl = `/uploads/${req.file.filename}`;
    await profile.save();

    res.json({ profileImageUrl: profile.profileImageUrl });
  }
);

router.get(
  "/status",
  authenticate,
  requireRole("therapist"),
  async (req: AuthRequest, res: Response) => {
    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json({ status: profile.status });
  }
);

export default router;
