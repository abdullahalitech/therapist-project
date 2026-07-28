import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  registerClientSchema,
  registerTherapistSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@therapist/shared";
import { User } from "../models/User";
import { TherapistProfile } from "../models/TherapistProfile";
import { validateBody } from "../middleware/validate";
import {
  AuthRequest,
  authenticate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth";
import { toUserPublic, generateUniqueSlug } from "../utils/serializers";
import { geocodeAddress } from "../services/geocode";
import { config } from "../config";
import { sendEmail, passwordResetEmail } from "../services/email";

const router = Router();

router.post("/register", validateBody(registerClientSchema), async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email,
    passwordHash,
    firstName,
    lastName,
    phone,
    role: "client",
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user: toUserPublic(user), accessToken });
});

router.post(
  "/register/therapist",
  validateBody(registerTherapistSchema),
  async (req, res) => {
    const data = req.body;

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    let user;
    try {
      const passwordHash = await bcrypt.hash(data.password, 12);
      user = await User.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "therapist",
      });

      const coords = await geocodeAddress(data.city, data.state, data.zip, data.country);
      const slug = generateUniqueSlug(data.firstName, data.lastName);

      await TherapistProfile.create({
        userId: user._id,
        slug,
        headline: data.headline,
        bio: data.bio,
        credentials: data.credentials || [],
        specialties: data.specialties,
        languages: data.languages,
        sessionTypes: data.sessionTypes,
        yearsExperience: data.yearsExperience,
        hourlyRate: data.hourlyRate,
        location: {
          city: data.city,
          state: data.state,
          country: data.country,
          zip: data.zip,
          address: data.address,
          ...(coords
            ? { coordinates: { type: "Point" as const, coordinates: coords } }
            : {}),
        },
      });
    } catch (err) {
      if (user) {
        await User.findByIdAndDelete(user._id);
      }
      console.error("Therapist registration failed:", err);
      res.status(500).json({
        error: "Registration failed. Please try again or contact support.",
      });
      return;
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: toUserPublic(user),
      accessToken,
      message: "Registration successful. Your profile is pending admin approval.",
    });
  }
);

router.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: toUserPublic(user), accessToken });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken, user: toUserPublic(user) });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, (req: AuthRequest, res: Response) => {
  res.json({ user: toUserPublic(req.user!) });
});

router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      html: passwordResetEmail({ name: user.firstName, resetUrl }),
    });
  }

  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

export default router;
