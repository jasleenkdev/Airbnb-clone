"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Booking, ReviewInput } from "@/types";

const CATEGORIES: { key: keyof Omit<ReviewInput, "booking_id" | "comment" | "rating">; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "check_in_rating", label: "Check-in" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
];

function Stars({ value, onChange, size = "h-6 w-6", label }: { value: number; onChange: (v: number) => void; size?: string; label: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
          onClick={() => onChange(s)}
          className="transition hover:scale-110"
        >
          <Star className={cn(size, s <= value ? "fill-gray-900 text-gray-900" : "text-gray-300")} />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState<ReviewInput>({
    booking_id: booking.id,
    rating: 0,
    cleanliness: 5,
    accuracy: 5,
    check_in_rating: 5,
    communication: 5,
    location: 5,
    value: 5,
    comment: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.rating) return setError("Please choose an overall rating.");
    if (form.comment.trim().length < 10) return setError("Tell future guests a bit more (at least 10 characters).");
    setSaving(true);
    try {
      await api.createReview({ ...form, comment: form.comment.trim() });
      toast.success("Thanks for your review!");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Leave a review"
      size="md"
      footer={
        <div className="flex justify-end">
          <Button onClick={submit} loading={saving}>
            Submit review
          </Button>
        </div>
      }
    >
      <h3 className="text-xl font-semibold">How was your stay at {booking.listing.title}?</h3>
      <div className="mt-4">
        <Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} size="h-9 w-9" label="Overall rating" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm font-semibold">{c.label}</span>
            <Stars value={form[c.key]} onChange={(v) => setForm({ ...form, [c.key]: v })} size="h-4 w-4" label={c.label} />
          </div>
        ))}
      </div>
      <label className="mt-6 block">
        <span className="text-sm font-semibold">Write a public review</span>
        <textarea
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          rows={5}
          maxLength={2000}
          placeholder="What did you love? What could be better?"
          className="mt-2 w-full rounded-lg border border-gray-400 p-3 outline-none focus:border-gray-900"
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
