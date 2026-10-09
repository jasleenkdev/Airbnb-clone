"use client";

import { Counter } from "@/components/ui/Counter";
import type { GuestCounts } from "@/lib/search";

export function GuestFields({
  value,
  onChange,
  maxGuests = 16,
}: {
  value: GuestCounts;
  onChange: (g: GuestCounts) => void;
  maxGuests?: number;
}) {
  const total = value.adults + value.children;
  const set = (patch: Partial<GuestCounts>) => {
    const next = { ...value, ...patch };
    // Children/infants/pets imply at least one adult.
    if ((next.children || next.infants || next.pets) && next.adults === 0) next.adults = 1;
    onChange(next);
  };
  return (
    <div className="divide-y divide-gray-200">
      <Counter
        label="Adults"
        description="Ages 13 or above"
        value={value.adults}
        min={value.children || value.infants || value.pets ? 1 : 0}
        max={value.adults + (maxGuests - total)}
        onChange={(adults) => set({ adults })}
      />
      <Counter
        label="Children"
        description="Ages 2 – 12"
        value={value.children}
        max={value.children + (maxGuests - total)}
        onChange={(children) => set({ children })}
      />
      <Counter label="Infants" description="Under 2" value={value.infants} max={5} onChange={(infants) => set({ infants })} />
      <Counter
        label="Pets"
        description={<span className="underline">Bringing a service animal?</span>}
        value={value.pets}
        max={5}
        onChange={(pets) => set({ pets })}
      />
    </div>
  );
}
