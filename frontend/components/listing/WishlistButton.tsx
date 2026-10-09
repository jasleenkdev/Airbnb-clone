"use client";

import { Heart } from "lucide-react";

import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/cn";

export function WishlistButton({ listingId, title, className }: { listingId: number; title?: string; className?: string }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(listingId);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(listingId, title);
      }}
      className={cn("group/heart p-1 transition active:scale-90", className)}
    >
      <Heart
        key={String(saved)}
        className={cn(
          "h-6 w-6 stroke-white stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
          saved ? "animate-pop fill-brand" : "fill-black/50 group-hover/heart:scale-110",
        )}
      />
    </button>
  );
}
