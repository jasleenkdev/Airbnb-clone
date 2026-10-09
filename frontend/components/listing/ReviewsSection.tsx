"use client";

import { format, parseISO } from "date-fns";
import { CircleCheck, Key, MapPin, MessageSquare, SprayCan, Star, Tag } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { plural, rating } from "@/lib/format";
import type { RatingSummary, Review } from "@/types";

const CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness", icon: SprayCan },
  { key: "accuracy", label: "Accuracy", icon: CircleCheck },
  { key: "check_in", label: "Check-in", icon: Key },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "location", label: "Location", icon: MapPin },
  { key: "value", label: "Value", icon: Tag },
] as const;

export function ReviewsSection({ summary, reviews }: { summary: RatingSummary; reviews: Review[] }) {
  const [open, setOpen] = useState(false);

  if (!summary.review_count) {
    return (
      <section id="reviews" className="border-t border-gray-200 py-12">
        <h2 className="flex items-center gap-2 text-[22px] font-semibold">
          <Star className="h-5 w-5 fill-current" /> No reviews (yet)
        </h2>
        <p className="mt-2 text-gray-600">This place is new. Be one of the first guests to leave a review!</p>
      </section>
    );
  }

  const total = summary.review_count;
  return (
    <section id="reviews" className="border-t border-gray-200 py-12">
      <h2 className="mb-8 flex items-center gap-2 text-[22px] font-semibold">
        <Star className="h-5 w-5 fill-current" />
        {rating(summary.avg_rating)} · {plural(total, "review")}
      </h2>

      <div className="mb-10 grid grid-cols-2 gap-y-6 md:grid-cols-7 md:divide-x md:divide-gray-200">
        <div className="col-span-2 pr-6 md:col-span-1">
          <div className="mb-2 text-sm font-semibold">Overall rating</div>
          {[5, 4, 3, 2, 1].map((star) => {
            const n = summary.distribution[String(star)] ?? 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-2">{star}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gray-900" style={{ width: `${(n / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {CATEGORIES.map(({ key, label, icon: CatIcon }) => (
          <div key={key} className="flex flex-col justify-between md:px-6">
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-lg font-semibold">{rating(summary[key])}</div>
            </div>
            <CatIcon className="mt-4 h-8 w-8 text-gray-700" strokeWidth={1.3} />
          </div>
        ))}
      </div>

      <div className="grid gap-x-24 gap-y-10 md:grid-cols-2">
        {reviews.slice(0, 6).map((r) => (
          <ReviewItem key={r.id} review={r} clamp />
        ))}
      </div>
      {reviews.length > 6 && (
        <Button variant="outline" className="mt-10" onClick={() => setOpen(true)}>
          Show all {plural(reviews.length, "review")}
        </Button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} size="lg" title={`${rating(summary.avg_rating)} · ${plural(total, "review")}`}>
        <div className="space-y-10">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </div>
      </Modal>
    </section>
  );
}

function ReviewItem({ review, clamp }: { review: Review; clamp?: boolean }) {
  return (
    <article>
      <div className="mb-3 flex items-center gap-3">
        <Avatar src={review.author.avatar_url} name={review.author.name} className="h-12 w-12" />
        <div>
          <div className="font-semibold">{review.author.name.split(" ")[0]}</div>
          <div className="text-sm text-gray-500">{format(parseISO(review.created_at), "MMMM yyyy")}</div>
        </div>
      </div>
      <div className="mb-1 flex items-center gap-0.5" aria-label={`Rated ${review.rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={cn("h-2.5 w-2.5", s <= review.rating ? "fill-gray-900 text-gray-900" : "text-gray-300")} />
        ))}
      </div>
      <p className={cn("leading-6 text-gray-800", clamp && "line-clamp-3")}>{review.comment}</p>
    </article>
  );
}
