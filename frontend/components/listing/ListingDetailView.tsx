"use client";

import { DoorOpen, Medal, MapPin, Share, Star, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BookingCard, bookHref } from "@/components/booking/BookingCard";
import { AmenitiesSection } from "@/components/listing/AmenitiesSection";
import { HostSection, yearsHosting } from "@/components/listing/HostSection";
import { LocationMap } from "@/components/listing/maps";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { ReviewsSection } from "@/components/listing/ReviewsSection";
import { WishlistButton } from "@/components/listing/WishlistButton";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { formatRange, money, nightsBetween, plural, PROPERTY_TYPE_LABELS, rating } from "@/lib/format";
import { EMPTY_GUESTS, type GuestCounts } from "@/lib/search";

export function ListingDetailView() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const listing = useFetch(() => api.listing(id), [id]);
  const availability = useFetch(() => api.availability(id), [id]);
  const reviews = useFetch(() => api.reviews(id), [id]);

  const [checkIn, setCheckIn] = useState<string | null>(params.get("check_in"));
  const [checkOut, setCheckOut] = useState<string | null>(params.get("check_out"));
  const [guests, setGuests] = useState<GuestCounts>({ ...EMPTY_GUESTS, adults: Math.max(1, Number(params.get("guests")) || 1) });
  const [descOpen, setDescOpen] = useState(false);

  if (listing.error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">We can&apos;t seem to find that place</h1>
        <p className="mt-2 text-gray-600">{listing.error}</p>
        <Link href="/" className="mt-6 inline-block font-semibold underline">
          Back to exploring
        </Link>
      </div>
    );
  }
  if (!listing.data) return <DetailSkeleton />;

  const l = listing.data;
  const booked = availability.data ?? [];
  const nights = nightsBetween(checkIn, checkOut);
  const isOwner = user?.id === l.host_id;
  const guestFavorite = (l.rating.avg_rating ?? 0) >= 4.85 && l.rating.review_count >= 3;
  const setDates = (a: string | null, b: string | null) => {
    setCheckIn(a);
    setCheckOut(b);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const descriptionPreview = l.description.split("\n\n")[0];

  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-6 pb-28 md:px-10 md:pb-16 xl:px-0">
      <title>{`${l.title} · ${l.city} · Airbnb Clone`}</title>
      <div className="mb-6 hidden items-end justify-between gap-4 md:flex">
        <h1 className="text-[26px] font-semibold">{l.title}</h1>
        <div className="flex shrink-0 gap-2 text-sm font-semibold">
          <button type="button" onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 underline hover:bg-gray-100">
            <Share className="h-4 w-4" /> Share
          </button>
          <span className="flex items-center rounded-lg pr-3 hover:bg-gray-100">
            <WishlistButton listingId={l.id} title={l.title} className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-transparent [&_svg]:stroke-gray-900 [&_svg]:stroke-2 [&_svg]:drop-shadow-none" />
            <span className="underline">Save</span>
          </span>
        </div>
      </div>

      <PhotoGallery images={l.images} title={l.title} />

      <div className="grid gap-16 pt-8 md:grid-cols-[1fr_minmax(0,370px)] lg:gap-24">
        <div className="min-w-0">
          <h1 className="mb-1 text-[26px] font-semibold md:hidden">{l.title}</h1>
          <h2 className="text-[22px] font-semibold">
            {PROPERTY_TYPE_LABELS[l.property_type]} in {l.city}, {l.country}
          </h2>
          <p className="text-gray-800">
            {[plural(l.max_guests, "guest"), plural(l.bedrooms, "bedroom"), plural(l.beds, "bed"), plural(l.bathrooms, "bath")].join(" · ")}
          </p>
          {guestFavorite ? (
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-200 px-6 py-4">
              <span className="text-center text-lg leading-5 font-semibold">
                Guest
                <br />
                favorite
              </span>
              <span className="hidden flex-1 text-sm text-gray-700 sm:block">One of the most loved homes on Airbnb, according to guests</span>
              <span className="text-center">
                <span className="block text-xl font-semibold">{rating(l.rating.avg_rating)}</span>
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-2.5 w-2.5 fill-current" />
                  ))}
                </span>
              </span>
              <a href="#reviews" className="border-l border-gray-200 pl-4 text-center">
                <span className="block text-xl font-semibold">{l.rating.review_count}</span>
                <span className="text-xs underline">Reviews</span>
              </a>
            </div>
          ) : (
            <p className="mt-1 flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 fill-current" /> {rating(l.rating.avg_rating)}
              {l.rating.review_count > 0 && (
                <>
                  {" · "}
                  <a href="#reviews" className="underline">
                    {plural(l.rating.review_count, "review")}
                  </a>
                </>
              )}
            </p>
          )}

          <div className="mt-8 flex items-center gap-5 border-y border-gray-200 py-6">
            <Avatar src={l.host.avatar_url} name={l.host.name} className="h-10 w-10" />
            <div>
              <div className="font-semibold">Hosted by {l.host.name.split(" ")[0]}</div>
              <div className="text-sm text-gray-500">
                {l.host.is_superhost ? "Superhost · " : ""}
                {plural(yearsHosting(l.host), "year")} hosting
              </div>
            </div>
          </div>

          <ul className="space-y-6 border-b border-gray-200 py-8">
            <Highlight icon={DoorOpen} title="Self check-in" text="Check yourself in with the keypad." />
            {l.host.is_superhost && (
              <Highlight
                icon={Medal}
                title={`${l.host.name.split(" ")[0]} is a Superhost`}
                text="Superhosts are experienced, highly rated hosts."
              />
            )}
            <Highlight icon={MapPin} title="Great location" text={`Recent guests loved the location in ${l.city}.`} />
            <Highlight icon={CalendarCheck} title="Free cancellation before check-in" text="Get a full refund if you change your mind." />
          </ul>

          <section className="border-b border-gray-200 py-8">
            <p className="leading-6 whitespace-pre-line text-gray-800">{descriptionPreview}</p>
            <button type="button" onClick={() => setDescOpen(true)} className="mt-4 font-semibold underline">
              Show more
            </button>
            <Modal open={descOpen} onClose={() => setDescOpen(false)} size="lg">
              <h2 className="mb-6 text-[26px] font-semibold">About this space</h2>
              <p className="leading-7 whitespace-pre-line text-gray-800">{l.description}</p>
            </Modal>
          </section>

          <div className="border-b border-gray-200">
            <AmenitiesSection amenities={l.amenities} />
          </div>

          <section id="availability" className="py-12">
            <h2 className="text-[22px] font-semibold">
              {checkIn && checkOut ? `${plural(nights, "night")} in ${l.city}` : "Select check-in date"}
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {checkIn && checkOut ? formatRange(checkIn, checkOut) : "Add your travel dates for exact pricing"}
            </p>
            <RangeCalendar checkIn={checkIn} checkOut={checkOut} booked={booked} onChange={setDates} />
            {(checkIn || checkOut) && (
              <button type="button" className="mt-4 text-sm font-semibold underline" onClick={() => setDates(null, null)}>
                Clear dates
              </button>
            )}
          </section>
        </div>

        <aside className="hidden md:block">
          <div className="sticky top-28">
            <BookingCard
              listing={l}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              booked={booked}
              onDatesChange={setDates}
              onGuestsChange={setGuests}
              isOwner={isOwner}
            />
          </div>
        </aside>
      </div>

      <ReviewsSection summary={l.rating} reviews={reviews.data ?? []} />

      <section className="border-t border-gray-200 py-12">
        <h2 className="mb-6 text-[22px] font-semibold">Where you&apos;ll be</h2>
        <div className="isolate h-[400px] overflow-hidden rounded-xl md:h-[480px]">
          <LocationMap lat={l.latitude} lng={l.longitude} />
        </div>
        <p className="mt-6 font-semibold">
          {l.city}
          {l.state ? `, ${l.state}` : ""}, {l.country}
        </p>
        <p className="mt-1 text-sm text-gray-600">Exact location provided after booking.</p>
      </section>

      <HostSection host={l.host} />

      {/* Mobile reserve bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 md:hidden">
        <div>
          <div>
            <span className="font-semibold">{money(l.price_per_night)}</span> night
          </div>
          {checkIn && checkOut ? (
            <div className="text-sm font-semibold underline">{formatRange(checkIn, checkOut)}</div>
          ) : (
            <div className="text-sm text-gray-500">Add dates</div>
          )}
        </div>
        <button
          type="button"
          disabled={isOwner}
          onClick={() =>
            checkIn && checkOut
              ? router.push(bookHref(l.id, checkIn, checkOut, guests))
              : document.getElementById("availability")?.scrollIntoView({ behavior: "smooth" })
          }
          className="bg-brand-gradient rounded-lg px-7 py-3 font-semibold text-white disabled:opacity-50"
        >
          {checkIn && checkOut ? "Reserve" : "Check availability"}
        </button>
      </div>
    </div>
  );
}

function Highlight({ icon: HIcon, title, text }: { icon: typeof DoorOpen; title: string; text: string }) {
  return (
    <li className="flex gap-6">
      <HIcon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-500">{text}</div>
      </div>
    </li>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-6 md:px-10 xl:px-0">
      <Skeleton className="mb-6 h-8 w-2/3" />
      <Skeleton className="h-[min(560px,45vw)] min-h-64 w-full rounded-xl" />
      <div className="mt-8 grid gap-16 md:grid-cols-[1fr_370px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="hidden h-72 rounded-xl md:block" />
      </div>
    </div>
  );
}
