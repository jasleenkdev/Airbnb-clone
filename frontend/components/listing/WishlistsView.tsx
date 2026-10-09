"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { GRID_CLASSES, ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { useWishlist } from "@/hooks/useWishlist";
import { api } from "@/lib/api";

export function WishlistsView() {
  const { user, ready } = useUser();
  const { ids } = useWishlist();
  const saved = useFetch(() => api.wishlist(), [user?.id], ready && !!user);
  // Hide items un-hearted on this page immediately (optimistic), without refetching.
  const items = (saved.data ?? []).filter((l) => ids.has(l.id));

  return (
    <div className="mx-auto max-w-[1760px] px-6 py-10 md:px-10 xl:px-20">
      <h1 className="mb-8 text-[32px] font-semibold">Wishlists</h1>
      {saved.error && <p className="text-red-600">{saved.error}</p>}
      {!saved.data && !saved.error ? (
        <div className={GRID_CLASSES}>
          {Array.from({ length: 5 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="max-w-md">
          <h2 className="text-[22px] font-semibold">Create your first wishlist</h2>
          <p className="mt-2 flex items-center gap-1 text-gray-600">
            As you search, tap the <Heart className="inline h-4 w-4" /> heart icon to save your favorite places.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white">
            Start exploring
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-gray-600">{items.length} saved</p>
          <div className={GRID_CLASSES}>
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
