import { Star } from "lucide-react";
import type { ReviewPublic } from "@therapist/shared";
import { formatDate } from "../lib/utils";

export function ReviewCard({ review }: { review: ReviewPublic }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
            />
          ))}
        </div>
        <span className="text-sm text-slate-500">{formatDate(review.createdAt)}</span>
      </div>
      <h4 className="mt-3 font-semibold text-slate-900">{review.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.body}</p>
      <p className="mt-3 text-sm font-medium text-slate-500">
        — {review.clientFirstName} {review.clientLastName}
      </p>
    </div>
  );
}
