export const BOOKING_TIME_SLOTS = [
  "Morning (9am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
] as const;

export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;
