import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ReviewPromptModal } from "../components/ReviewPromptModal";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import type { BookingPublic } from "@therapist/shared";
import { Calendar, Star, MessageSquare } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800",
};

function ClientDashboard() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviewBooking, setReviewBooking] = useState<BookingPublic | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: api.getMyBookings,
  });

  const pendingReviews = bookings.filter((b) => b.needsReview);

  useEffect(() => {
    const reviewId = searchParams.get("review");
    if (reviewId && bookings.length > 0) {
      const booking = bookings.find((b) => b.id === reviewId && b.needsReview);
      if (booking) {
        setReviewBooking(booking);
        searchParams.delete("review");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [bookings, searchParams, setSearchParams]);

  const handleReviewSubmit = async (data: {
    bookingId: string;
    rating: number;
    title: string;
    body: string;
  }) => {
    setReviewError("");
    setIsSubmitting(true);
    try {
      await api.createReview(data);
      setReviewBooking(null);
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      const remaining = pendingReviews.filter((b) => b.id !== data.bookingId);
      if (remaining.length > 0) {
        setTimeout(() => setReviewBooking(remaining[0]), 300);
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const grouped = {
    pending: bookings.filter((b) => b.status === "pending"),
    confirmed: bookings.filter((b) => b.status === "confirmed"),
    completed: bookings.filter((b) => b.status === "completed"),
    other: bookings.filter((b) => ["declined", "cancelled"].includes(b.status)),
  };

  return (
    <Layout>
      <SEO title="My Dashboard" />

      {reviewBooking && (
        <ReviewPromptModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={handleReviewSubmit}
          error={reviewError}
          isSubmitting={isSubmitting}
        />
      )}

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="mt-2 text-slate-600">Track appointments and share feedback after sessions</p>

          {pendingReviews.length > 0 && !reviewBooking && (
            <div className="mt-6 flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <MessageSquare className="h-6 w-6 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  You have {pendingReviews.length} session{pendingReviews.length > 1 ? "s" : ""} awaiting review
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Help others by sharing your experience with your therapist.
                </p>
              </div>
              <button
                onClick={() => setReviewBooking(pendingReviews[0])}
                className="btn-primary shrink-0 gap-1 py-2 text-sm"
              >
                <Star className="h-4 w-4" />
                Leave Review
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="card mt-8 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-600">No bookings yet</p>
              <Link to="/therapists" className="btn-primary mt-4 inline-flex">
                Find a Therapist
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {[
                { key: "confirmed", label: "Upcoming Sessions", items: grouped.confirmed },
                { key: "pending", label: "Pending Requests", items: grouped.pending },
                { key: "completed", label: "Completed Sessions", items: grouped.completed },
                { key: "other", label: "Past Requests", items: grouped.other },
              ]
                .filter((section) => section.items.length > 0)
                .map((section) => (
                  <div key={section.key}>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {section.label}
                    </h2>
                    <div className="space-y-4">
                      {section.items.map((b) => (
                        <BookingCard
                          key={b.id}
                          booking={b}
                          onReview={() => setReviewBooking(b)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function BookingCard({
  booking,
  onReview,
}: {
  booking: BookingPublic;
  onReview: () => void;
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/therapists/${booking.therapistSlug}`}
            className="font-semibold text-primary-700 hover:underline"
          >
            {booking.therapistName}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(booking.preferredDate)} · {booking.preferredTime}
          </p>
          {booking.message && (
            <p className="mt-2 text-sm text-slate-500">{booking.message}</p>
          )}
          {booking.therapistResponseNote && (
            <p className="mt-2 text-sm text-slate-600">
              Therapist note: {booking.therapistResponseNote}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[booking.status]}`}
          >
            {booking.status}
          </span>
          {booking.needsReview && (
            <button onClick={onReview} className="btn-primary gap-1 py-1.5 text-xs">
              <Star className="h-3.5 w-3.5" />
              Leave Review
            </button>
          )}
          {booking.hasReview && (
            <span className="text-xs font-medium text-green-600">Reviewed</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <ProtectedRoute roles={["client"]}>
      <ClientDashboard />
    </ProtectedRoute>
  );
}
