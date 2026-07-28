import { Router, Response } from "express";
import { bookingSchema, bookingResponseSchema } from "@therapist/shared";
import { BookingRequest } from "../models/BookingRequest";
import { TherapistProfile } from "../models/TherapistProfile";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { validateBody } from "../middleware/validate";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import {
  sendEmail,
  bookingRequestEmail,
  bookingStatusEmail,
  bookingCompletedEmail,
} from "../services/email";
import { hasOverlappingBooking } from "../utils/bookingOverlap";
import { config } from "../config";

const router = Router();

function serializeClientBooking(
  b: InstanceType<typeof BookingRequest>,
  profile: {
    _id: { toString(): string };
    slug: string;
    userId: { firstName: string; lastName: string };
  },
  hasReview: boolean
) {
  const therapistUser = profile.userId;
  const needsReview = b.status === "completed" && !hasReview;
  return {
    id: b._id.toString(),
    therapistId: profile._id.toString(),
    therapistName: `${therapistUser.firstName} ${therapistUser.lastName}`,
    therapistSlug: profile.slug,
    preferredDate: b.preferredDate.toISOString(),
    preferredTime: b.preferredTime,
    message: b.message,
    status: b.status,
    therapistResponseNote: b.therapistResponseNote,
    confirmedAt: b.confirmedAt?.toISOString(),
    completedAt: b.completedAt?.toISOString(),
    createdAt: b.createdAt.toISOString(),
    hasReview,
    needsReview,
  };
}

router.post(
  "/",
  authenticate,
  requireRole("client"),
  validateBody(bookingSchema),
  async (req: AuthRequest, res: Response) => {
    const { therapistId, preferredDate, preferredTime, message } = req.body;

    const profile = await TherapistProfile.findOne({
      _id: therapistId,
      status: "approved",
    });

    if (!profile) {
      res.status(404).json({ error: "Therapist not found" });
      return;
    }

    const bookingDate = new Date(preferredDate);
    const overlap = await hasOverlappingBooking(profile._id, bookingDate, preferredTime);

    if (overlap) {
      res.status(409).json({
        error: "This time slot is already booked. Please choose a different date or time.",
      });
      return;
    }

    const booking = await BookingRequest.create({
      clientId: req.user!._id,
      therapistId: profile._id,
      preferredDate: bookingDate,
      preferredTime,
      message,
    });

    const [client, therapistUser] = await Promise.all([
      User.findById(req.user!._id),
      User.findById(profile.userId),
    ]);

    if (therapistUser && client) {
      void sendEmail({
        to: therapistUser.email,
        subject: "New Booking Request",
        html: bookingRequestEmail({
          therapistName: therapistUser.firstName,
          clientName: `${client.firstName} ${client.lastName}`,
          preferredDate: bookingDate.toLocaleDateString(),
          preferredTime,
          message,
        }),
      });
    }

    res.status(201).json({
      id: booking._id.toString(),
      message: "Booking request submitted",
    });
  }
);

router.get(
  "/me",
  authenticate,
  requireRole("client"),
  async (req: AuthRequest, res: Response) => {
    const bookings = await BookingRequest.find({ clientId: req.user!._id })
      .sort({ createdAt: -1 })
      .populate({ path: "therapistId", populate: { path: "userId" } });

    const bookingIds = bookings.map((b) => b._id);
    const reviews = await Review.find({ bookingId: { $in: bookingIds } });
    const reviewedSet = new Set(reviews.map((r) => r.bookingId.toString()));

    const data = bookings.map((b) => {
      const profile = b.therapistId as unknown as {
        _id: { toString(): string };
        slug: string;
        userId: { firstName: string; lastName: string };
      };
      return serializeClientBooking(b, profile, reviewedSet.has(b._id.toString()));
    });

    res.json(data);
  }
);

router.get(
  "/me/pending-reviews",
  authenticate,
  requireRole("client"),
  async (req: AuthRequest, res: Response) => {
    const completed = await BookingRequest.find({
      clientId: req.user!._id,
      status: "completed",
    }).populate({ path: "therapistId", populate: { path: "userId" } });

    const bookingIds = completed.map((b) => b._id);
    const reviews = await Review.find({ bookingId: { $in: bookingIds } });
    const reviewedSet = new Set(reviews.map((r) => r.bookingId.toString()));

    const pending = completed
      .filter((b) => !reviewedSet.has(b._id.toString()))
      .map((b) => {
        const profile = b.therapistId as unknown as {
          _id: { toString(): string };
          slug: string;
          userId: { firstName: string; lastName: string };
        };
        return serializeClientBooking(b, profile, false);
      });

    res.json(pending);
  }
);

router.get(
  "/therapist/inbox",
  authenticate,
  requireRole("therapist"),
  async (req: AuthRequest, res: Response) => {
    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Therapist profile not found" });
      return;
    }

    const bookings = await BookingRequest.find({ therapistId: profile._id })
      .sort({ preferredDate: 1, preferredTime: 1 })
      .populate("clientId", "firstName lastName email");

    res.json(
      bookings.map((b) => {
        const client = b.clientId as unknown as {
          firstName: string;
          lastName: string;
          email: string;
          _id: { toString(): string };
        };
        return {
          id: b._id.toString(),
          clientId: client._id.toString(),
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email,
          preferredDate: b.preferredDate.toISOString(),
          preferredTime: b.preferredTime,
          message: b.message,
          status: b.status,
          therapistResponseNote: b.therapistResponseNote,
          confirmedAt: b.confirmedAt?.toISOString(),
          completedAt: b.completedAt?.toISOString(),
          createdAt: b.createdAt.toISOString(),
        };
      })
    );
  }
);

router.patch(
  "/therapist/:id",
  authenticate,
  requireRole("therapist"),
  validateBody(bookingResponseSchema),
  async (req: AuthRequest, res: Response) => {
    const profile = await TherapistProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ error: "Therapist profile not found" });
      return;
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      therapistId: profile._id,
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const { status, therapistResponseNote } = req.body;

    if (status === "confirmed" && booking.status !== "pending") {
      res.status(400).json({ error: "Only pending bookings can be confirmed" });
      return;
    }

    if (status === "completed" && booking.status !== "confirmed") {
      res.status(400).json({ error: "Only confirmed bookings can be marked completed" });
      return;
    }

    if (status === "confirmed") {
      const overlap = await hasOverlappingBooking(
        profile._id,
        booking.preferredDate,
        booking.preferredTime,
        booking._id.toString()
      );
      if (overlap) {
        res.status(409).json({
          error: "Cannot confirm — this time slot conflicts with another booking.",
        });
        return;
      }
    }

    booking.status = status;
    if (therapistResponseNote !== undefined) {
      booking.therapistResponseNote = therapistResponseNote;
    }
    if (status === "confirmed") {
      booking.confirmedAt = new Date();
    }
    if (status === "completed") {
      booking.completedAt = new Date();
    }
    await booking.save();

    const [client, therapistUser] = await Promise.all([
      User.findById(booking.clientId),
      User.findById(req.user!._id),
    ]);

    if (client && therapistUser) {
      if (status === "completed") {
        const reviewUrl = `${config.clientUrl}/dashboard?review=${booking._id.toString()}`;
        void sendEmail({
          to: client.email,
          subject: "How was your session? Leave a review",
          html: bookingCompletedEmail({
            clientName: client.firstName,
            therapistName: `${therapistUser.firstName} ${therapistUser.lastName}`,
            reviewUrl,
          }),
        });
      } else {
        void sendEmail({
          to: client.email,
          subject: "Booking Status Update",
          html: bookingStatusEmail({
            clientName: client.firstName,
            therapistName: `${therapistUser.firstName} ${therapistUser.lastName}`,
            status,
            note: therapistResponseNote,
          }),
        });
      }
    }

    res.json({ message: "Booking updated", status: booking.status });
  }
);

export default router;
