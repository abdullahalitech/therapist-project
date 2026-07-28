import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingFormSchema, BOOKING_TIME_SLOTS } from "@therapist/shared";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { api } from "../lib/api";
import { CheckCircle, AlertCircle } from "lucide-react";

type BookingForm = z.infer<typeof bookingFormSchema>;

function BookingFormPage() {
  const { therapistSlug } = useParams<{ therapistSlug: string }>();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const { data: therapist, isLoading } = useQuery({
    queryKey: ["therapist", therapistSlug],
    queryFn: () => api.getTherapist(therapistSlug!),
    enabled: !!therapistSlug,
  });

  const { data: availability } = useQuery({
    queryKey: ["availability", therapistSlug, selectedDate],
    queryFn: () => api.getTherapistAvailability(therapistSlug!, selectedDate),
    enabled: !!therapistSlug && !!selectedDate,
  });

  const bookedSlots = new Set(availability?.bookedSlots ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingForm>({ resolver: zodResolver(bookingFormSchema) });

  const watchedDate = watch("preferredDate");
  const watchedTime = watch("preferredTime");

  useEffect(() => {
    setSelectedDate(watchedDate || "");
  }, [watchedDate]);

  useEffect(() => {
    if (watchedTime && availability?.bookedSlots.includes(watchedTime)) {
      setValue("preferredTime", "");
    }
  }, [availability, watchedTime, setValue]);

  const onSubmit = async (data: BookingForm) => {
    if (!therapist) return;
    setError("");
    try {
      await api.createBooking({ ...data, therapistId: therapist.id });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!therapist) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">Therapist not found</h1>
          <Link to="/therapists" className="btn-primary mt-6 inline-flex">
            Back to Directory
          </Link>
        </div>
      </Layout>
    );
  }

  const allSlotsBooked = Boolean(
    selectedDate && BOOKING_TIME_SLOTS.every((slot) => bookedSlots.has(slot))
  );

  return (
    <Layout>
      <SEO
        title="Request Booking"
        description={`Book an appointment with ${therapist.firstName} ${therapist.lastName}`}
      />

      <section className="py-12">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          {submitted ? (
            <div className="card py-10 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-4 text-2xl font-bold">Booking Request Sent!</h1>
              <p className="mt-2 text-slate-600">
                {therapist.firstName} will review your request and get back to you soon.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/dashboard" className="btn-primary">
                  View My Bookings
                </Link>
                <Link to={`/therapists/${therapist.slug}`} className="btn-secondary">
                  Back to Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <h1 className="text-2xl font-bold">Request a Booking</h1>
              <p className="mt-2 text-slate-600">
                with {therapist.firstName} {therapist.lastName}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">Preferred Date</label>
                  <input
                    {...register("preferredDate")}
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field"
                  />
                  {errors.preferredDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferredDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Preferred Time</label>
                  {!selectedDate ? (
                    <p className="text-sm text-slate-500">Select a date first to see available times</p>
                  ) : allSlotsBooked ? (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      All time slots are booked for this date. Please choose another date.
                    </div>
                  ) : (
                    <select {...register("preferredTime")} className="input-field">
                      <option value="">Select a time</option>
                      {BOOKING_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot} disabled={bookedSlots.has(slot)}>
                          {slot}
                          {bookedSlots.has(slot) ? " — Booked" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.preferredTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferredTime.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Message (optional)</label>
                  <textarea
                    {...register("message")}
                    rows={4}
                    placeholder="Tell the therapist about your needs..."
                    className="input-field"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || allSlotsBooked}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                  <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export default function BookingPage() {
  return (
    <ProtectedRoute roles={["client"]}>
      <BookingFormPage />
    </ProtectedRoute>
  );
}
