import { Star, MapPin, Video, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { TherapistProfilePublic } from "@therapist/shared";
import { cn, formatRating } from "../lib/utils";

interface TherapistCardProps {
  therapist: TherapistProfilePublic;
  className?: string;
}

export function TherapistCard({ therapist, className }: TherapistCardProps) {
  return (
    <Link
      to={`/therapists/${therapist.slug}`}
      className={cn(
        "group card flex flex-col transition hover:border-primary-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700">
          {therapist.profileImageUrl ? (
            <img
              src={therapist.profileImageUrl}
              alt={`${therapist.firstName} ${therapist.lastName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-primary-700">
            {therapist.firstName} {therapist.lastName}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{therapist.headline}</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            {therapist.reviewCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {formatRating(therapist.averageRating)} ({therapist.reviewCount})
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {therapist.location.city}, {therapist.location.state}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {therapist.specialties.slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {therapist.sessionTypes.includes("online") && (
          <span className="flex items-center gap-1">
            <Video className="h-3.5 w-3.5" /> Online
          </span>
        )}
        {therapist.sessionTypes.includes("in-person") && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> In-person
          </span>
        )}
        {therapist.hourlyRate && (
          <span className="ml-auto font-medium text-slate-700">${therapist.hourlyRate}/hr</span>
        )}
      </div>
    </Link>
  );
}
