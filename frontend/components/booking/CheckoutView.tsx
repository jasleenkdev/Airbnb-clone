"use client";

import { isBefore, parseISO, startOfDay } from "date-fns";
import { AlertCircle, ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useQuote } from "@/components/booking/BookingCard";
import { EMPTY_PAYMENT, PaymentForm, type PaymentDetails, validatePayment } from "@/components/booking/PaymentForm";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { GuestFields } from "@/components/search/GuestFields";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatRange, plural, PROPERTY_TYPE_LABELS, rating, shortDate } from "@/lib/format";
import { EMPTY_GUESTS, type GuestCounts, guestSummary, totalGuests } from "@/lib/search";

function overlapsBooked(checkIn: string, checkOut: string, booked: { check_in: string; check_out: string }[]) {
  return booked.some((b) => checkIn < b.check_out && b.check_in < checkOut);
}

export function CheckoutView() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const listing = useFetch(() => api.listing(id), [id]);
  const availability = useFetch(() => api.availability(id), [id]);

  const [checkIn, setCheckIn] = useState<string | null>(params.get("check_in"));
  const [checkOut, setCheckOut] = useState<string | null>(params.get("check_out"));
  const [guests, setGuests] = useState<GuestCounts>({
    ...EMPTY_GUESTS,
    adults: Math.max(1, Number(params.get("guests")) || 1),
    infants: Number(params.get("infants")) || 0,
    pets: Number(params.get("pets")) || 0,
  });
  const [editing, setEditing] = useState<"dates" | "guests" | null>(null);
  const [payment, setPayment] = useState<PaymentDetails>(EMPTY_PAYMENT);
  const [paymentErrors, setPaymentErrors] = useState<Partial<Record<keyof PaymentDetails, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quote = useQuote(Number(id), checkIn, checkOut);
  const booked = useMemo(() => availability.data ?? [], [availability.data]);

  // Inline validation before we ever hit the API.
  const dateError = useMemo(() => {
    if (!checkIn || !checkOut) return "Choose your check-in and checkout dates.";
    if (checkOut <= checkIn) return "Checkout must be after check-in.";
    if (isBefore(parseISO(checkIn), startOfDay(new Date()))) return "Check-in can't be in the past.";
    if (overlapsBooked(checkIn, checkOut, booked)) return "Those dates are already booked. Please pick different dates.";
    return null;
  }, [checkIn, checkOut, booked]);

  if (listing.error) {
    return <p className="px-6 py-24 text-center text-gray-600">{listing.error}</p>;
  }
  if (!listing.data) return <CheckoutSkeleton />;
  const l = listing.data;
  const isOwner = user?.id === l.host_id;
  const guestError = totalGuests(guests) > l.max_guests ? `This place allows up to ${plural(l.max_guests, "guest")}.` : null;

  const confirm = async () => {
    setSubmitError(null);
    const errs = validatePayment(payment);
    setPaymentErrors(errs);
    const problem = dateError ?? guestError ?? (isOwner ? "You can't book your own listing." : null);
    if (problem) {
      setSubmitError(problem);
      toast.error(problem);
      return;
    }
    if (Object.keys(errs).length) {
      toast.error("Please check your payment details.");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        listing_id: l.id,
        check_in: checkIn!,
        check_out: checkOut!,
        guests: Math.max(1, totalGuests(guests)),
      });
      toast.success("Reservation confirmed!");
      router.push(`/book/confirmed/${booking.id}`);
    } catch (err) {
      const msg = errorMessage(err);
      setSubmitError(msg);
      toast.error(msg);
      if (err instanceof ApiError && err.status === 409) availability.reload();
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-8 pb-24 md:px-10 md:pt-16 xl:px-0">
      <div className="mb-8 flex items-center gap-4 md:-ml-14">
        <Link href={`/rooms/${l.id}`} aria-label="Back to listing" className="rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[26px] font-semibold md:text-[32px]">Confirm and pay</h1>
      </div>

      <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,440px)] lg:gap-24">
        <div className="order-2 md:order-1">
          <section className="border-b border-gray-200 pb-8">
            <h2 className="mb-6 text-[22px] font-semibold">Your trip</h2>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">Dates</div>
                <div className="text-gray-700">{checkIn && checkOut ? formatRange(checkIn, checkOut) : "Not selected"}</div>
              </div>
              <button type="button" className="font-semibold underline" onClick={() => setEditing("dates")}>
                Edit
              </button>
            </div>
            <div className="mt-6 flex items-start justify-between">
              <div>
                <div className="font-semibold">Guests</div>
                <div className="text-gray-700">{guestSummary(guests) || "1 guest"}</div>
              </div>
              <button type="button" className="font-semibold underline" onClick={() => setEditing("guests")}>
                Edit
              </button>
            </div>
            {(dateError || guestError) && (
              <p className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" /> {dateError ?? guestError}
              </p>
            )}
          </section>

          <section className="border-b border-gray-200 py-8">
            <h2 className="mb-6 text-[22px] font-semibold">Pay with</h2>
            <PaymentForm value={payment} onChange={setPayment} errors={paymentErrors} />
          </section>

          <section className="border-b border-gray-200 py-8">
            <h2 className="mb-2 text-[22px] font-semibold">Cancellation policy</h2>
            <p className="text-gray-700">
              {checkIn ? (
                <>
                  <b>Free cancellation before {shortDate(checkIn)}.</b> Cancel any time before
                  check-in from My Trips for a full refund.
                </>
              ) : (
                "Free cancellation before check-in."
              )}
            </p>
          </section>

          <section className="py-8">
            <h2 className="mb-2 text-[22px] font-semibold">Ground rules</h2>
            <p className="text-gray-700">We ask every guest to remember a few simple things about what makes a great guest.</p>
            <ul className="mt-2 list-disc pl-5 text-gray-700">
              <li>Follow the house rules</li>
              <li>Treat your Host&apos;s home like your own</li>
            </ul>
            <p className="mt-8 text-xs text-gray-500">
              By selecting the button below, I agree to the Host&apos;s House Rules, Ground rules for guests, and that Airbnb
              can charge my payment method if I&apos;m responsible for damage. (This is a demo — no charge is made.)
            </p>
            {submitError && (
              <p className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
              </p>
            )}
            <Button variant="brand" size="lg" className="mt-6 w-full md:w-auto md:px-10" loading={submitting} onClick={confirm} disabled={isOwner}>
              Confirm and pay
            </Button>
          </section>
        </div>

        <aside className="order-1 md:order-2">
          <div className="rounded-xl border border-gray-200 p-6 md:sticky md:top-28">
            <div className="flex gap-4 border-b border-gray-200 pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.images[0]?.url} alt={l.title} className="h-24 w-28 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{l.title}</div>
                <div className="text-sm text-gray-600">
                  {PROPERTY_TYPE_LABELS[l.property_type]} in {l.city}
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-current" /> {rating(l.rating.avg_rating)}
                  <span className="text-gray-500">({l.rating.review_count})</span>
                  {l.host.is_superhost && <span className="text-gray-500"> · Superhost</span>}
                </div>
              </div>
            </div>
            <h3 className="pt-6 pb-4 text-[22px] font-semibold">Price details</h3>
            {quote && !dateError ? (
              <PriceBreakdown quote={quote} />
            ) : dateError ? (
              <p className="text-sm text-gray-500">Select valid dates to see the price.</p>
            ) : (
              <Skeleton className="h-32" />
            )}
          </div>
        </aside>
      </div>

      <Modal open={editing === "dates"} onClose={() => setEditing(null)} title="Edit dates" size="xl"
        footer={
          <div className="flex justify-between">
            <button type="button" className="font-semibold underline" onClick={() => { setCheckIn(null); setCheckOut(null); }}>
              Clear dates
            </button>
            <Button onClick={() => setEditing(null)} disabled={!checkIn || !checkOut}>Save</Button>
          </div>
        }
      >
        <RangeCalendar
          checkIn={checkIn}
          checkOut={checkOut}
          booked={booked}
          onChange={(a, b) => {
            setCheckIn(a);
            setCheckOut(b);
            setSubmitError(null);
          }}
        />
      </Modal>
      <Modal open={editing === "guests"} onClose={() => setEditing(null)} title="Guests" size="sm"
        footer={<div className="flex justify-end"><Button onClick={() => setEditing(null)}>Save</Button></div>}
      >
        <GuestFields value={guests} onChange={setGuests} maxGuests={l.max_guests} />
        <p className="mt-2 text-xs text-gray-600">
          This place has a maximum of {plural(l.max_guests, "guest")}, not including infants.
        </p>
      </Modal>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-16 md:px-10 xl:px-0">
      <Skeleton className="mb-10 h-9 w-72" />
      <div className="grid gap-24 md:grid-cols-[1fr_440px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

