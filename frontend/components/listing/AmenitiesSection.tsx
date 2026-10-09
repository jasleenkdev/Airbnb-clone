"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import type { Amenity } from "@/types";

export function AmenitiesSection({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="py-12">
      <h2 className="mb-6 text-[22px] font-semibold">What this place offers</h2>
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {amenities.slice(0, 10).map((a) => (
          <li key={a.id} className="flex items-center gap-4">
            <Icon name={a.icon} className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
            <span>{a.name}</span>
          </li>
        ))}
      </ul>
      {amenities.length > 10 && (
        <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>
          Show all {amenities.length} amenities
        </Button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} size="md">
        <h2 className="mb-6 text-[22px] font-semibold">What this place offers</h2>
        <ul className="divide-y divide-gray-200">
          {amenities.map((a) => (
            <li key={a.id} className="flex items-center gap-4 py-5">
              <Icon name={a.icon} className="h-6 w-6 text-gray-800" strokeWidth={1.5} />
              <span>{a.name}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
