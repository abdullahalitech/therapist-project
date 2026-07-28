import { Types } from "mongoose";
import { BookingRequest } from "../models/BookingRequest";
import { ACTIVE_BOOKING_STATUSES } from "@therapist/shared";

export function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function hasOverlappingBooking(
  therapistId: string | Types.ObjectId,
  preferredDate: Date,
  preferredTime: string,
  excludeBookingId?: string
): Promise<boolean> {
  const { start, end } = getDayBounds(preferredDate);

  const filter: Record<string, unknown> = {
    therapistId,
    preferredTime,
    preferredDate: { $gte: start, $lte: end },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  };

  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId };
  }

  const count = await BookingRequest.countDocuments(filter);
  return count > 0;
}

export async function getBookedSlotsForDate(
  therapistId: string | Types.ObjectId,
  date: Date
): Promise<string[]> {
  const { start, end } = getDayBounds(date);

  const bookings = await BookingRequest.find({
    therapistId,
    preferredDate: { $gte: start, $lte: end },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select("preferredTime");

  return bookings.map((b) => b.preferredTime);
}
