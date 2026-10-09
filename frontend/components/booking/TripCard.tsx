import Link from "next/link";

import { cn } from "@/lib/cn";
import { formatRange, money, plural } from "@/lib/format";
import type { Booking } from "@/types";

const STATUS_STYLES = {
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-50 text-red-700",
};

export function TripCard({ booking, actions }: { booking: Booking; actions?: React.ReactNode }) {
  const b = booking;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-card sm:flex-row">
      <Link href={`/rooms/${b.listing_id}`} className="shrink-0 sm:w-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.listing.image ?? ""} alt={b.listing.title} className="h-48 w-full object-cover sm:h-full" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/rooms/${b.listing_id}`} className="block truncate text-lg font-semibold hover:underline">
              {b.listing.city}
            </Link>
            <p className="truncate text-sm text-gray-600">
              {b.listing.title} · Hosted by {b.listing.host_name}
            </p>
          </div>
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_STYLES[b.status])}>
            {b.status}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Dates</dt>
            <dd className="font-semibold">{formatRange(b.check_in, b.check_out)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Guests</dt>
            <dd className="font-semibold">{plural(b.guests, "guest")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Total</dt>
            <dd className="font-semibold">{money(b.total_price)}</dd>
          </div>
        </dl>
        {actions && <div className="mt-auto flex flex-wrap gap-3 pt-5">{actions}</div>}
      </div>
    </article>
  );
}
