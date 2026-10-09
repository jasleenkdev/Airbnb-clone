"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ReviewModal } from "@/components/booking/ReviewModal";
import { TripCard } from "@/components/booking/TripCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatRange } from "@/lib/format";
import type { Booking } from "@/types";

type Tab = "upcoming" | "past" | "cancelled";

export function TripsView() {
  const { user, ready } = useUser();
  const trips = useFetch(() => api.myBookings(), [user?.id], ready && !!user);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState<Booking | null>(null);

  const all = trips.data ?? [];
  const groups: Record<Tab, Booking[]> = {
    upcoming: all.filter((b) => b.status === "confirmed").sort((a, b) => a.check_in.localeCompare(b.check_in)),
    past: all.filter((b) => b.status === "completed"),
    cancelled: all.filter((b) => b.status === "cancelled"),
  };

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api.cancelBooking(cancelling.id);
      toast.success("Your reservation was cancelled");
      setCancelling(null);
      trips.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 md:px-10 xl:px-0">
      <h1 className="text-[32px] font-semibold">Trips</h1>
      <div role="tablist" className="mt-6 flex gap-6 border-b border-gray-200">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-semibold capitalize transition",
              tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900",
            )}
          >
            {t} {trips.data && <span className="text-gray-400">({groups[t].length})</span>}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {trips.error && <p className="text-red-600">{trips.error}</p>}
        {!trips.data && !trips.error && [0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        {trips.data && groups[tab].length === 0 && (
          <div className="rounded-2xl border border-gray-200 p-10">
            <h2 className="text-[22px] font-semibold">
              {tab === "upcoming" ? "No trips booked...yet!" : tab === "past" ? "No past trips" : "No cancelled trips"}
            </h2>
            <p className="mt-2 text-gray-600">Time to dust off your bags and start planning your next adventure.</p>
            <Link href="/" className="mt-6 inline-block rounded-lg border border-gray-900 px-6 py-3 font-semibold hover:bg-gray-50">
              Start searching
            </Link>
          </div>
        )}
        {trips.data &&
          groups[tab].map((b) => (
            <TripCard
              key={b.id}
              booking={b}
              actions={
                <>
                  {b.can_cancel && (
                    <Button variant="outline" size="sm" onClick={() => setCancelling(b)}>
                      Cancel reservation
                    </Button>
                  )}
                  {b.can_review && (
                    <Button variant="dark" size="sm" onClick={() => setReviewing(b)}>
                      Leave a review
                    </Button>
                  )}
                  {b.has_review && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                      <CircleCheck className="h-4 w-4" /> Reviewed
                    </span>
                  )}
                  {b.status === "completed" && (
                    <Link href={`/rooms/${b.listing_id}`} className="px-1 py-1.5 text-sm font-semibold underline">
                      Book again
                    </Link>
                  )}
                </>
              }
            />
          ))}
      </div>

      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel reservation"
        size="sm"
        footer={
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setCancelling(null)}>
              Keep it
            </Button>
            <Button variant="brand" loading={busy} onClick={cancel}>
              Cancel reservation
            </Button>
          </div>
        }
      >
        {cancelling && (
          <p className="text-gray-700">
            Cancel your stay at <b>{cancelling.listing.title}</b> ({formatRange(cancelling.check_in, cancelling.check_out)})?
            You&apos;ll get a full refund and the dates will open up for other guests.
          </p>
        )}
      </Modal>

      {reviewing && (
        <ReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            trips.reload();
          }}
        />
      )}
    </div>
  );
}
