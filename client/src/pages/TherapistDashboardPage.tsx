import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { api } from "../lib/api";
import { formatDate } from "../lib/utils";
import {
  User, Upload, Clock, CheckCircle, XCircle, CalendarCheck, Calendar,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-800",
};

interface TherapistBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: string;
  therapistResponseNote?: string;
  createdAt: string;
}

function TherapistDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "confirmed" | "completed">("all");
  const [notesByBooking, setNotesByBooking] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["therapist-profile"],
    queryFn: api.getTherapistProfile,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["therapist-bookings"],
    queryFn: api.getTherapistBookings,
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      headline: "",
      bio: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      hourlyRate: 0,
    },
  });

  const handleBookingAction = async (
    id: string,
    status: "confirmed" | "declined" | "completed"
  ) => {
    setActionError("");
    try {
      await api.updateBooking(id, {
        status,
        therapistResponseNote: notesByBooking[id] || undefined,
      });
      setNotesByBooking((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["therapist-bookings"] });
      if (status === "completed") {
        setMessage("Session marked complete. Client will be prompted to leave a review.");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.uploadProfileImage(file);
    queryClient.invalidateQueries({ queryKey: ["therapist-profile"] });
    setMessage("Profile image updated");
  };

  const onProfileSubmit = async (data: Record<string, unknown>) => {
    await api.updateTherapistProfile(data);
    queryClient.invalidateQueries({ queryKey: ["therapist-profile"] });
    queryClient.invalidateQueries({ queryKey: ["therapists"] });
    queryClient.invalidateQueries({ queryKey: ["therapist"] });
    setMessage("Profile updated successfully. Your public listing will reflect these changes.");
  };

  useEffect(() => {
    if (profile) {
      reset({
        headline: profile.headline,
        bio: profile.bio,
        address: profile.location.address || "",
        city: profile.location.city,
        state: profile.location.state,
        zip: profile.location.zip,
        hourlyRate: profile.hourlyRate || 0,
      });
    }
  }, [profile, reset]);

  const isPlaceholderProfile = profile?.bio.includes("pending completion");

  const filteredBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <Layout>
      <SEO title="Therapist Dashboard" />

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Therapist Dashboard</h1>
              {profile && (
                <p className="mt-1 text-sm text-slate-600">
                  Profile status:{" "}
                  <span
                    className={`font-medium capitalize ${
                      profile.status === "approved"
                        ? "text-green-600"
                        : profile.status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {profile.status}
                  </span>
                </p>
              )}
            </div>
            {activeTab === "bookings" && (
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="h-4 w-4" /> {counts.pending} pending
                </span>
                <span className="flex items-center gap-1.5 text-green-700">
                  <Calendar className="h-4 w-4" /> {counts.confirmed} upcoming
                </span>
                <span className="flex items-center gap-1.5 text-blue-700">
                  <CalendarCheck className="h-4 w-4" /> {counts.completed} completed
                </span>
              </div>
            )}
          </div>

          {actionError && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
          )}
          {isPlaceholderProfile && activeTab === "profile" && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Complete your profile:</strong> Some details may have been reset during account
              setup. Please update your bio and office location below — especially city, state, and ZIP.
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <div className="mt-6 flex gap-2 border-b">
            {(["bookings", "profile"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "bookings" && (
            <div className="mt-8">
              <div className="mb-6 flex flex-wrap gap-2">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "confirmed", label: "Upcoming" },
                    { id: "completed", label: "Completed" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBookingFilter(f.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      bookingFilter === f.id
                        ? "bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="card py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-slate-600">No bookings in this category</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      note={notesByBooking[b.id] || ""}
                      onNoteChange={(note) =>
                        setNotesByBooking((prev) => ({ ...prev, [b.id]: note }))
                      }
                      onAction={handleBookingAction}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && profile && (
            <div className="mt-8">
              <div className="card mb-6">
                <h3 className="font-semibold">Profile Photo</h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-primary-600" />
                    )}
                  </div>
                  <label className="btn-secondary cursor-pointer gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <form onSubmit={handleSubmit(onProfileSubmit)} className="card space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Headline</label>
                  <input {...register("headline")} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Bio</label>
                  <textarea {...register("bio")} rows={4} className="input-field" />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Office Location</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    This address appears on your public profile and is used for location search.
                  </p>
                  {profile && (
                    <p className="mt-2 text-sm font-medium text-primary-700">
                      Currently listed as: {profile.location.city}, {profile.location.state}{" "}
                      {profile.location.zip}
                    </p>
                  )}
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Street Address (optional)</label>
                      <input {...register("address")} placeholder="e.g. 123 Main St" className="input-field" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">City</label>
                        <input {...register("city")} placeholder="e.g. Chicago" className="input-field" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">State</label>
                        <input {...register("state")} placeholder="e.g. IL" className="input-field" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">ZIP</label>
                        <input {...register("zip")} placeholder="e.g. 60601" className="input-field" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Hourly Rate ($)</label>
                  <input
                    {...register("hourlyRate", { valueAsNumber: true })}
                    type="number"
                    className="input-field"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function BookingCard({
  booking,
  note,
  onNoteChange,
  onAction,
}: {
  booking: TherapistBooking;
  note: string;
  onNoteChange: (note: string) => void;
  onAction: (id: string, status: "confirmed" | "declined" | "completed") => void;
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{booking.clientName}</p>
          <p className="text-sm text-slate-500">{booking.clientEmail}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Calendar className="h-4 w-4 text-primary-600" />
            {formatDate(booking.preferredDate)} · {booking.preferredTime}
          </p>
          {booking.message && (
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {booking.message}
            </p>
          )}
          {booking.therapistResponseNote && (
            <p className="mt-2 text-sm text-slate-500">
              Your note: {booking.therapistResponseNote}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[booking.status]}`}
        >
          {booking.status}
        </span>
      </div>

      {(booking.status === "pending" || booking.status === "confirmed") && (
        <div className="mt-4 border-t pt-4">
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Optional note to client..."
              rows={2}
              className="input-field"
            />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {booking.status === "pending" && (
              <>
                <button
                  onClick={() => onAction(booking.id, "confirmed")}
                  className="btn-primary gap-1 py-2 text-sm"
                >
                  <CheckCircle className="h-4 w-4" /> Confirm
                </button>
                <button
                  onClick={() => onAction(booking.id, "declined")}
                  className="btn-secondary gap-1 py-2 text-sm text-red-600"
                >
                  <XCircle className="h-4 w-4" /> Decline
                </button>
              </>
            )}
            {booking.status === "confirmed" && (
              <button
                onClick={() => onAction(booking.id, "completed")}
                className="btn-primary gap-1 py-2 text-sm"
              >
                <CalendarCheck className="h-4 w-4" /> Mark Session Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TherapistDashboardPage() {
  return (
    <ProtectedRoute roles={["therapist"]}>
      <TherapistDashboard />
    </ProtectedRoute>
  );
}
