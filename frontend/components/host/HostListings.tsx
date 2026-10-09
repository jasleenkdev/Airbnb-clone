"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { api, errorMessage } from "@/lib/api";
import { money, PROPERTY_TYPE_LABELS } from "@/lib/format";
import type { ListingCard } from "@/types";

export function HostListings({ listings, onChanged }: { listings: ListingCard[]; onChanged: () => void }) {
  const [deleting, setDeleting] = useState<ListingCard | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteListing(deleting.id);
      toast.success(`Deleted “${deleting.title}”`);
      setDeleting(null);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
        <h3 className="text-xl font-semibold">You don&apos;t have any listings yet</h3>
        <p className="mt-2 text-gray-600">Create your first listing to start hosting.</p>
        <Link href="/host/listings/new" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white">
          <Plus className="h-4 w-4" /> Create listing
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Listing</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Rating</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.images[0]} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                    <span className="line-clamp-2 font-semibold">{l.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {l.city}, {l.country}
                </td>
                <td className="px-5 py-3 text-gray-700">{PROPERTY_TYPE_LABELS[l.property_type]}</td>
                <td className="px-5 py-3 font-semibold">{money(l.price_per_night)}</td>
                <td className="px-5 py-3">
                  <StarRating value={l.avg_rating} count={l.review_count} />
                </td>
                <td className="px-5 py-3">
                  <RowActions listing={l} onDelete={() => setDeleting(l)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-4 md:hidden">
        {listings.map((l) => (
          <li key={l.id} className="overflow-hidden rounded-2xl border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.images[0]} alt="" className="h-40 w-full object-cover" />
            <div className="p-4">
              <div className="font-semibold">{l.title}</div>
              <div className="text-sm text-gray-600">
                {l.city}, {l.country} · {money(l.price_per_night)} night
              </div>
              <div className="mt-3">
                <RowActions listing={l} onDelete={() => setDeleting(l)} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete listing"
        size="sm"
        footer={
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="brand" loading={busy} onClick={remove}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Permanently delete <b>{deleting?.title}</b>? Its photos, reviews and past reservations will be removed too. Listings
          with upcoming reservations can&apos;t be deleted.
        </p>
      </Modal>
    </>
  );
}

function RowActions({ listing, onDelete }: { listing: ListingCard; onDelete: () => void }) {
  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:border-gray-900";
  return (
    <div className="flex justify-end gap-2 md:justify-end">
      <Link href={`/rooms/${listing.id}`} className={btn} aria-label={`View ${listing.title}`}>
        <Eye className="h-3.5 w-3.5" /> View
      </Link>
      <Link href={`/host/listings/${listing.id}/edit`} className={btn} aria-label={`Edit ${listing.title}`}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Link>
      <button type="button" onClick={onDelete} className={`${btn} text-red-600 hover:border-red-600`} aria-label={`Delete ${listing.title}`}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}
