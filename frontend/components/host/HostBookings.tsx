import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { formatRange, money, plural } from "@/lib/format";
import type { Booking } from "@/types";

const STATUS = {
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-50 text-red-700",
};

export function HostBookings({ bookings, empty }: { bookings: Booking[]; empty: string }) {
  if (!bookings.length) {
    return <div className="rounded-2xl border border-gray-200 p-10 text-center text-gray-600">{empty}</div>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-2xl border border-gray-200 p-5 transition hover:shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={b.guest.avatar_url} name={b.guest.name} className="h-11 w-11" />
              <div>
                <div className="font-semibold">{b.guest.name}</div>
                <div className="text-sm text-gray-500">{plural(b.guests, "guest")}</div>
              </div>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS[b.status])}>{b.status}</span>
          </div>
          <Link href={`/rooms/${b.listing_id}`} className="mt-4 block truncate text-sm font-semibold hover:underline">
            {b.listing.title}
          </Link>
          <div className="mt-1 flex justify-between text-sm text-gray-600">
            <span>
              {formatRange(b.check_in, b.check_out)} · {plural(b.nights, "night")}
            </span>
            <span className="font-semibold text-gray-900" title="Payout excludes the guest service fee">
              {money(b.total_price - b.service_fee)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
