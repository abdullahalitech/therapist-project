import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema } from "@therapist/shared";
import { z } from "zod";
import { Star, X } from "lucide-react";
import type { BookingPublic } from "@therapist/shared";

type ReviewForm = z.infer<typeof reviewSchema>;

interface ReviewPromptModalProps {
  booking: BookingPublic;
  onClose: () => void;
  onSubmit: (data: ReviewForm) => Promise<void>;
  error?: string;
  isSubmitting?: boolean;
}

export function ReviewPromptModal({
  booking,
  onClose,
  onSubmit,
  error,
  isSubmitting,
}: ReviewPromptModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { bookingId: booking.id, rating: 5, title: "", body: "" },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">How was your session?</h2>
            <p className="text-sm text-slate-600">
              Share your experience with {booking.therapistName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <input type="hidden" {...register("bookingId")} />
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Rating</label>
            <select {...register("rating", { valueAsNumber: true })} className="input-field">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Review Title</label>
            <input
              {...register("title")}
              placeholder="Summarize your experience"
              className="input-field"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your Review</label>
            <textarea
              {...register("body")}
              rows={4}
              placeholder="What did you appreciate about your session?"
              className="input-field"
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
