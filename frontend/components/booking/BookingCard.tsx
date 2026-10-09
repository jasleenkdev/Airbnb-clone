"use client";

import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { GuestFields } from "@/components/search/GuestFields";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatRange, money, nightsBetween, plural, shortDate } from "@/lib/format";
import { type GuestCounts, guestSummary, totalGuests } from "@/lib/search";
import type { BookedRange, ListingDetail, PriceQuote } from "@/types";

interface BookingCardProps {
  listing: ListingDetail;
  checkIn: string | null;
  checkOut: string | null;
  guests: GuestCounts;
  booked: BookedRange[];
  onDatesChange: (checkIn: string | null, checkOut: string | null) => void;
  onGuestsChange: (g: GuestCounts) => void;
  isOwner: boolean;
}

export function bookHref(listingId: number, checkIn: string, checkOut: string, guests: GuestCounts) {
  const p = new URLSearchParams({
    check_in: checkIn,
    check_out: checkOut,
    guests: String(Math.max(1, totalGuests(guests))),
  });
  if (guests.infants) p.set("infants", String(guests.infants));
  if (guests.pets) p.set("pets", String(guests.pets));
  return `/book/${listingId}?${p}`;
}

export function useQuote(listingId: number, checkIn: string | null, checkOut: string | null) {
  const [quote, setQuote] = useState<{ key: string; value: PriceQuote | null }>({ key: "", value: null });
  const key = checkIn && checkOut ? `${checkIn}:${checkOut}` : "";
  useEffect(() => {
    if (!checkIn || !checkOut) return;
    let cancelled = false;
    api
      .quote(listingId, checkIn, checkOut)
      .then((q) => !cancelled && setQuote({ key: `${checkIn}:${checkOut}`, value: q }))
      .catch(() => !cancelled && setQuote({ key: `${checkIn}:${checkOut}`, value: null }));
    return () => {
      cancelled = true;
    };
  }, [listingId, checkIn, checkOut]);
  return quote.key === key && key ? quote.value : null;
}

export function BookingCard({
  listing,
  checkIn,
  checkOut,
  guests,
  booked,
  onDatesChange,
  onGuestsChange,
  isOwner,
}: BookingCardProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<"dates" | "guests" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const quote = useQuote(listing.id, checkIn, checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  const hasDates = !!(checkIn && checkOut);

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanel(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [panel]);

  const reserve = () => {
    if (!hasDates) {
      setPanel("dates");
      return;
    }
    router.push(bookHref(listing.id, checkIn!, checkOut!, guests));
  };

  const guestLabel = guestSummary(guests) || "1 guest";

  return (
    <div ref={rootRef} className="relative">
      <div className="rounded-xl border border-gray-200 p-6 shadow-card">
        <div className="mb-6 flex items-baseline gap-1">
          {quote ? (
            <>
              <span className="text-[22px] font-semibold">{money(quote.total_price)}</span>
              <span className="text-gray-700">for {plural(nights, "night")}</span>
            </>
          ) : (
            <>
              <span className="text-[22px] font-semibold">{money(listing.price_per_night)}</span>
              <span className="text-gray-700">night</span>
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-400">
          <div className="grid grid-cols-2 border-b border-gray-400">
            <button
              type="button"
              onClick={() => setPanel(panel === "dates" ? null : "dates")}
              className="rounded-tl-lg px-3 py-2.5 text-left"
            >
              <div className="text-[10px] font-bold tracking-wide uppercase">Check-in</div>
              <div className={cn("text-sm", !checkIn && "text-gray-500")}>{checkIn ? shortDate(checkIn) : "Add date"}</div>
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "dates" ? null : "dates")}
              className="border-l border-gray-400 px-3 py-2.5 text-left"
            >
              <div className="text-[10px] font-bold tracking-wide uppercase">Checkout</div>
              <div className={cn("text-sm", !checkOut && "text-gray-500")}>{checkOut ? shortDate(checkOut) : "Add date"}</div>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPanel(panel === "guests" ? null : "guests")}
            aria-expanded={panel === "guests"}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
          >
            <span>
              <span className="block text-[10px] font-bold tracking-wide uppercase">Guests</span>
              <span className="block text-sm">{guestLabel}</span>
            </span>
            {panel === "guests" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {panel === "guests" && (
          <div className="animate-fade-in absolute right-6 left-6 z-20 mt-1 rounded-lg bg-white px-4 pb-4 shadow-float">
            <GuestFields value={guests} onChange={onGuestsChange} maxGuests={listing.max_guests} />
            <p className="text-xs text-gray-600">
              This place has a maximum of {plural(listing.max_guests, "guest")}, not including infants. Pets are welcome on
              request.
            </p>
            <div className="mt-3 text-right">
              <button type="button" className="font-semibold underline" onClick={() => setPanel(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={reserve}
          disabled={isOwner}
          className="bg-brand-gradient mt-4 w-full rounded-lg py-3.5 text-base font-semibold text-white transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isOwner ? "This is your listing" : hasDates ? "Reserve" : "Check availability"}
        </button>

        {hasDates && (
          <>
            <p className="mt-3 text-center text-sm text-gray-700">You won&apos;t be charged yet</p>
            {quote ? (
              <PriceBreakdown quote={quote} className="mt-6" />
            ) : (
              <div className="mt-6 h-32 animate-pulse rounded-lg bg-gray-100" />
            )}
          </>
        )}
      </div>

      {panel === "dates" && (
        <div className="animate-fade-in absolute top-24 right-0 z-30 w-[min(680px,90vw)] rounded-2xl bg-white p-6 shadow-float">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[22px] font-semibold">{hasDates ? plural(nights, "night") : "Select dates"}</h3>
              <p className="text-sm text-gray-500">
                {hasDates ? formatRange(checkIn!, checkOut!) : "Add your travel dates for exact pricing"}
              </p>
            </div>
          </div>
          <RangeCalendar checkIn={checkIn} checkOut={checkOut} booked={booked} onChange={onDatesChange} />
          <div className="mt-4 flex justify-end gap-4">
            <button type="button" className="font-semibold underline" onClick={() => onDatesChange(null, null)}>
              Clear dates
            </button>
            <button
              type="button"
              className="rounded-lg bg-gray-900 px-5 py-2 font-semibold text-white"
              onClick={() => setPanel(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
        <Flag className="h-4 w-4" /> <span className="underline">Report this listing</span>
      </p>
    </div>
  );
}
