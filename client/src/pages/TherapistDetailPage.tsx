import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Star, MapPin, Video, User, Calendar, Globe, Award, DollarSign,
} from "lucide-react";
import { Layout } from "../components/Layout";
import { SEO } from "../components/SEO";
import { ReviewCard } from "../components/ReviewCard";
import { api } from "../lib/api";
import { formatRating } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function TherapistDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: therapist, isLoading, error } = useQuery({
    queryKey: ["therapist", slug],
    queryFn: () => api.getTherapist(slug!),
    enabled: !!slug,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["therapist-reviews", slug],
    queryFn: () => api.getTherapistReviews(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </Layout>
    );
  }

  if (error || !therapist) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">Therapist not found</h1>
          <Link to="/therapists" className="btn-primary mt-6 inline-flex">Back to Directory</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`${therapist.firstName} ${therapist.lastName}`}
        description={therapist.headline}
      />

      <section className="bg-gradient-to-br from-primary-50 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-primary-700">
              {therapist.profileImageUrl ? (
                <img
                  src={therapist.profileImageUrl}
                  alt={`${therapist.firstName} ${therapist.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {therapist.firstName} {therapist.lastName}
              </h1>
              <p className="mt-2 text-lg text-slate-600">{therapist.headline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {therapist.reviewCount > 0 && (
                  <span className="flex items-center gap-1 font-medium text-amber-600">
                    <Star className="h-5 w-5 fill-current" />
                    {formatRating(therapist.averageRating)} ({therapist.reviewCount} reviews)
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {therapist.location.city}, {therapist.location.state}
                </span>
                {therapist.hourlyRate && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    ${therapist.hourlyRate}/hr
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {therapist.specialties.map((s) => (
                  <span key={s} className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              {user?.role === "client" ? (
                <Link to={`/book/${therapist.slug}`} className="btn-primary gap-2">
                  <Calendar className="h-5 w-5" />
                  Request Booking
                </Link>
              ) : user ? (
                <p className="text-sm text-slate-500">Only clients can request bookings</p>
              ) : (
                <Link to="/login" state={{ from: `/book/${therapist.slug}` }} className="btn-primary gap-2">
                  <Calendar className="h-5 w-5" />
                  Log in to Book
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card">
              <h2 className="text-xl font-semibold">About</h2>
              <p className="mt-4 leading-relaxed text-slate-600 whitespace-pre-line">{therapist.bio}</p>
            </div>

            {reviewsData && reviewsData.data.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reviews ({reviewsData.total})</h2>
                <div className="space-y-4">
                  {reviewsData.data.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold">Details</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {therapist.yearsExperience && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary-600" />
                    <span>{therapist.yearsExperience} years experience</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-600" />
                  <span>{therapist.languages.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {therapist.sessionTypes.includes("online") && (
                    <span className="flex items-center gap-1"><Video className="h-4 w-4" /> Online</span>
                  )}
                  {therapist.sessionTypes.includes("in-person") && (
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> In-person</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-600 mt-0.5" />
                  <span>
                    {therapist.location.address && <>{therapist.location.address}<br /></>}
                    {therapist.location.city}, {therapist.location.state} {therapist.location.zip}
                  </span>
                </div>
              </dl>
            </div>

            {therapist.credentials.length > 0 && (
              <div className="card">
                <h3 className="font-semibold">Credentials</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {therapist.credentials.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Award className="h-4 w-4 shrink-0 text-primary-600 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
