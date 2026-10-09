"use client";

import { Building2, Check, House, Hotel, TentTree, Trees, Umbrella, Warehouse, Castle } from "lucide-react";
import { useEffect, useState } from "react";

import { PriceRange } from "@/components/search/PriceRange";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import { type SearchState, toListingQuery } from "@/lib/search";
import type { Amenity, PriceHistogram } from "@/types";

const PROPERTY_TYPES = [
  { value: "house", label: "House", icon: House },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "villa", label: "Villa", icon: Castle },
  { value: "cabin", label: "Cabin", icon: TentTree },
  { value: "cottage", label: "Cottage", icon: Warehouse },
  { value: "tiny_home", label: "Tiny home", icon: Hotel },
  { value: "treehouse", label: "Treehouse", icon: Trees },
  { value: "beachfront", label: "Beachfront", icon: Umbrella },
];

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
  state: SearchState;
  onApply: (next: SearchState) => void;
}

export function FiltersModal({ open, onClose, state, onApply }: FiltersModalProps) {
  if (!open) return null;
  return <FiltersModalInner onClose={onClose} state={state} onApply={onApply} />;
}

function FiltersModalInner({ onClose, state, onApply }: Omit<FiltersModalProps, "open">) {
  const [draft, setDraft] = useState<SearchState>(state);
  const [histogram, setHistogram] = useState<PriceHistogram | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Histogram ignores the price filter itself, but respects every other filter.
    api.priceHistogram(toListingQuery({ ...state, minPrice: null, maxPrice: null })).then(setHistogram).catch(() => {});
    api.amenities().then(setAmenities).catch(() => {});
  }, [state]);

  // Live "Show N places" count, debounced.
  useEffect(() => {
    const t = setTimeout(() => {
      api
        .listings({ ...toListingQuery(draft), page_size: 1 })
        .then((p) => setCount(p.total))
        .catch(() => setCount(null));
    }, 250);
    return () => clearTimeout(t);
  }, [draft]);

  const set = (patch: Partial<SearchState>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const lo = histogram?.min_price ?? 0;
  const hi = histogram?.max_price ?? 1000;
  const priceMin = draft.minPrice ?? lo;
  const priceMax = draft.maxPrice ?? hi;

  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 10);

  const clearAll = () =>
    setDraft({ ...draft, minPrice: null, maxPrice: null, types: [], amenities: [], bedrooms: 0, beds: 0, bathrooms: 0 });

  return (
    <Modal
      open
      onClose={onClose}
      title="Filters"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={clearAll} className="font-semibold underline">
            Clear all
          </button>
          <Button
            variant="dark"
            size="lg"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {count == null ? "Show places" : count === 0 ? "No exact matches" : `Show ${count} place${count === 1 ? "" : "s"}`}
          </Button>
        </div>
      }
    >
      <section className="border-b border-gray-200 pb-8">
        <h3 className="text-[22px] font-semibold">Price range</h3>
        <p className="mb-6 text-sm text-gray-600">Nightly prices before fees and taxes</p>
        {histogram ? (
          <PriceRange
            histogram={histogram}
            min={priceMin}
            max={priceMax}
            onChange={(min, max) => set({ minPrice: min <= lo ? null : min, maxPrice: max >= hi ? null : max })}
          />
        ) : (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
        )}
      </section>

      <section className="border-b border-gray-200 py-8">
        <h3 className="mb-6 text-[22px] font-semibold">Property type</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROPERTY_TYPES.map(({ value, label, icon: TypeIcon }) => {
            const on = draft.types.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => set({ types: toggle(draft.types, value) })}
                className={cn(
                  "flex h-28 flex-col justify-between rounded-xl border p-4 text-left transition",
                  on ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-300 hover:border-gray-900",
                )}
              >
                <TypeIcon className="h-8 w-8" strokeWidth={1.5} />
                <span className="font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-b border-gray-200 py-8">
        <h3 className="mb-4 text-[22px] font-semibold">Rooms and beds</h3>
        {(
          [
            ["Bedrooms", "bedrooms"],
            ["Beds", "beds"],
            ["Bathrooms", "bathrooms"],
          ] as const
        ).map(([label, key]) => (
          <div key={key} className="py-3">
            <div className="mb-3">{label}</div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={draft[key] === n}
                  onClick={() => set({ [key]: n } as Partial<SearchState>)}
                  className={cn(
                    "shrink-0 rounded-full border px-5 py-2.5 text-sm transition",
                    draft[key] === n ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:border-gray-900",
                  )}
                >
                  {n === 0 ? "Any" : n === 8 ? "8+" : n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="pt-8">
        <h3 className="mb-6 text-[22px] font-semibold">Amenities</h3>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {visibleAmenities.map((a) => {
            const on = draft.amenities.includes(a.id);
            return (
              <label key={a.id} className="flex cursor-pointer items-center gap-4 py-3">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={() => set({ amenities: toggle(draft.amenities, a.id) })}
                />
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900",
                    on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-400",
                  )}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <Icon name={a.icon} className="h-5 w-5 text-gray-700" strokeWidth={1.6} />
                <span>{a.name}</span>
              </label>
            );
          })}
        </div>
        {amenities.length > 10 && (
          <button type="button" className="mt-4 font-semibold underline" onClick={() => setShowAllAmenities((s) => !s)}>
            {showAllAmenities ? "Show less" : "Show more"}
          </button>
        )}
      </section>
    </Modal>
  );
}
