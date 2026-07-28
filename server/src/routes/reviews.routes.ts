import { Router, Response } from "express";
import { reviewSchema } from "@therapist/shared";
import { Review } from "../models/Review";
import { BookingRequest } from "../models/BookingRequest";
import { validateBody } from "../middleware/validate";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import { updateTherapistRating } from "../utils/serializers";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("client"),
  validateBody(reviewSchema),
  async (req: AuthRequest, res: Response) => {
    const { bookingId, rating, title, body } = req.body;

    const booking = await BookingRequest.findOne({
      _id: bookingId,
      clientId: req.user!._id,
      status: "completed",
    });

    if (!booking) {
      res.status(400).json({
        error: "You can only review therapists after a completed session",
      });
      return;
    }

    const existing = await Review.findOne({ bookingId });
    if (existing) {
      res.status(409).json({ error: "You have already reviewed this booking" });
      return;
    }

    const review = await Review.create({
      therapistId: booking.therapistId,
      clientId: req.user!._id,
      bookingId,
      rating,
      title,
      body,
    });

    await updateTherapistRating(booking.therapistId.toString());

    res.status(201).json({
      id: review._id.toString(),
      message: "Review submitted",
    });
  }
);

export default router;
