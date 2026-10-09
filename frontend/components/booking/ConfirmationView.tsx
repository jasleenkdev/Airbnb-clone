"use client";

import { CalendarDays, CircleCheck, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { longDate, money, plural } from "@/lib/format";

export function ConfirmationView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, ready } = useUser();
  const booking = useFetch(() => api.booking(bookingId), [bookingId, user?.id], ready && !!user);

  if (booking.error) return <p className="px-6 py-24 text-center text-gray-600">{booking.error}</p>;
  if (!booking.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  const b = booking.data;
  const code = `HM${String(b.id).padStart(6, "0")}${b.listing_id}`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <div className="mb-8 flex items-center gap-3 text-green-700">
        <CircleCheck className="h-8 w-8" />
        <span className="font-semibold">Booking confirmed</span>
      </div>
      <h1 className="text-[32px] leading-tight font-semibold">Pack your bags! You&apos;re going to {b.listing.city}.</h1>
      <p className="mt-2 text-gray-600">
        Confirmation code <span className="font-mono font-semibold text-gray-900">{code}</span>. We&apos;ve let{" "}
        {b.listing.host_name.split(" ")[0]} know you&apos;re coming.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 shadow-card">
        {b.listing.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.listing.image} alt={b.listing.title} className="h-56 w-full object-cover md:h-72" />
        )}
        <div className="p-6">
          <h2 className="text-xl font-semibold">{b.listing.title}</h2>
          <p className="text-gray-600">
            {b.listing.city}, {b.listing.country} · Hosted by {b.listing.host_name}
          </p>
          <div className="mt-6 grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">Check-in</div>
                <div className="text-sm text-gray-600">{longDate(b.check_in)}</div>
                <div className="mt-2 text-sm font-semibold">Checkout</div>
                <div className="text-sm text-gray-600">{longDate(b.check_out)}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">Guests</div>
                <div className="text-sm text-gray-600">{plural(b.guests, "guest")}</div>
                <div className="mt-2 text-sm font-semibold">Total paid</div>
                <div className="text-sm text-gray-600">{money(b.total_price)} USD</div>
              </div>
            </div>
          </div>
          <PriceBreakdown
            className="mt-6 border-t border-gray-200 pt-6"
            quote={{
              nights: b.nights,
              nightly_price: b.nightly_price,
              subtotal: b.nightly_price * b.nights,
              cleaning_fee: b.cleaning_fee,
              service_fee: b.service_fee,
              total_price: b.total_price,
            }}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/trips" className="bg-brand-gradient rounded-lg px-6 py-3 font-semibold text-white">
          View my trips
        </Link>
        <Link href={`/rooms/${b.listing_id}`} className="rounded-lg border border-gray-900 px-6 py-3 font-semibold">
          View listing
        </Link>
        <Link href="/" className="rounded-lg px-6 py-3 font-semibold underline">
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
