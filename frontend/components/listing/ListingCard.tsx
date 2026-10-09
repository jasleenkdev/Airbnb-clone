import Link from "next/link";

import { ImageCarousel } from "@/components/listing/ImageCarousel";
import { WishlistButton } from "@/components/listing/WishlistButton";
import { StarRating } from "@/components/ui/StarRating";
import { formatRange, money, nightsBetween, plural, PROPERTY_TYPE_LABELS } from "@/lib/format";
import type { ListingCard as Listing } from "@/types";

interface Props {
  listing: Listing;
  checkIn?: string | null;
  checkOut?: string | null;
  /** Extra query string appended to the listing link (dates/guests). */
  linkQuery?: string;
}

export function ListingCard({ listing, checkIn, checkOut, linkQuery }: Props) {
  const nights = nightsBetween(checkIn, checkOut);
  const guestFavorite = (listing.avg_rating ?? 0) >= 4.85 && listing.review_count >= 3;
  return (
    <Link href={`/rooms/${listing.id}${linkQuery ? `?${linkQuery}` : ""}`} className="group block">
      <div className="relative">
        <ImageCarousel images={listing.images} alt={listing.title} className="aspect-[20/19] rounded-xl bg-gray-100" />
        {guestFavorite && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-[13px] font-semibold shadow-sm">
            Guest favorite
          </span>
        )}
        <WishlistButton listingId={listing.id} title={listing.title} className="absolute top-2.5 right-2.5" />
      </div>
      <div className="mt-3 text-[15px] leading-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-gray-900">
            {PROPERTY_TYPE_LABELS[listing.property_type]} in {listing.city}, {listing.country}
          </h3>
          <StarRating value={listing.avg_rating} className="shrink-0 text-[15px]" />
        </div>
        <p className="truncate text-gray-500">{listing.title}</p>
        <p className="truncate text-gray-500">
          {checkIn && checkOut
            ? formatRange(checkIn, checkOut)
            : `${plural(listing.beds, "bed")} · ${plural(listing.bedrooms, "bedroom")}`}
        </p>
        <p className="mt-1.5 text-gray-900">
          <span className="font-semibold">{money(listing.price_per_night)}</span> night
          {nights > 0 && (
            <span className="text-gray-500">
              {" "}
              · <span className="underline">{money(listing.price_per_night * nights)} total</span>
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div>
      <div className="aspect-[20/19] animate-pulse rounded-xl bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export const GRID_CLASSES =
  "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1880px]:grid-cols-6";
