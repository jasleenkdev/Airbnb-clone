"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { POPULAR_DESTINATIONS } from "@/components/search/destinations";
import { GuestFields } from "@/components/search/GuestFields";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/format";
import { type GuestCounts, guestSummary } from "@/lib/search";

export type Segment = "where" | "checkIn" | "checkOut" | "who";

export interface SearchDraft extends GuestCounts {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface SearchBarProps {
  draft: SearchDraft;
  onDraftChange: (d: SearchDraft) => void;
  active: Segment | null;
  onActiveChange: (s: Segment | null) => void;
  onSubmit: () => void;
}

/** The expanded, four-segment desktop search bar with its dropdown panels. */
export function SearchBar({ draft, onDraftChange, active, onActiveChange, onSubmit }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active === "where") inputRef.current?.focus();
  }, [active]);

  const set = (patch: Partial<SearchDraft>) => onDraftChange({ ...draft, ...patch });

  const segment = (key: Segment) =>
    cn(
      "relative flex h-full flex-col justify-center rounded-full px-6 text-left transition",
      active === key ? "bg-white shadow-card" : "hover:bg-gray-200/70",
    );

  const clearBtn = (onClear: () => void, show: boolean, label: string) =>
    show && (
      <button
        type="button"
        aria-label={`Clear ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-gray-200 p-1 hover:bg-gray-300"
      >
        <X className="h-3 w-3" strokeWidth={3} />
      </button>
    );

  const guests = guestSummary(draft);

  return (
    <div className="relative mx-auto w-full max-w-[850px]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={cn(
          "grid h-16 grid-cols-[1.4fr_1fr_1fr_1.4fr] items-center rounded-full border border-gray-200 shadow-pill",
          active ? "bg-gray-100" : "bg-white",
        )}
      >
        <div className={segment("where")} onClick={() => onActiveChange("where")}>
          <label htmlFor="search-where" className="text-xs font-semibold">
            Where
          </label>
          <input
            id="search-where"
            ref={inputRef}
            value={draft.location}
            onChange={(e) => set({ location: e.target.value })}
            onFocus={() => onActiveChange("where")}
            placeholder="Search destinations"
            autoComplete="off"
            className="w-full truncate bg-transparent pr-6 text-sm text-gray-900 outline-none placeholder:text-gray-500"
          />
          {active === "where" && clearBtn(() => set({ location: "" }), !!draft.location, "destination")}
        </div>
        <button type="button" className={segment("checkIn")} onClick={() => onActiveChange("checkIn")}>
          <span className="text-xs font-semibold">Check in</span>
          <span className={cn("truncate text-sm", draft.checkIn ? "text-gray-900" : "text-gray-500")}>
            {draft.checkIn ? shortDate(draft.checkIn) : "Add dates"}
          </span>
          {active === "checkIn" && clearBtn(() => set({ checkIn: null, checkOut: null }), !!draft.checkIn, "dates")}
        </button>
        <button type="button" className={segment("checkOut")} onClick={() => onActiveChange("checkOut")}>
          <span className="text-xs font-semibold">Check out</span>
          <span className={cn("truncate text-sm", draft.checkOut ? "text-gray-900" : "text-gray-500")}>
            {draft.checkOut ? shortDate(draft.checkOut) : "Add dates"}
          </span>
          {active === "checkOut" && clearBtn(() => set({ checkOut: null }), !!draft.checkOut, "check-out")}
        </button>
        <div className={cn(segment("who"), "flex-row items-center justify-between pr-2")}>
          <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={() => onActiveChange("who")}>
            <span className="text-xs font-semibold">Who</span>
            <span className={cn("truncate text-sm", guests ? "text-gray-900" : "text-gray-500")}>
              {guests || "Add guests"}
            </span>
          </button>
          <button
            type="submit"
            aria-label="Search"
            className={cn(
              "bg-brand-gradient flex h-12 items-center justify-center gap-2 rounded-full font-semibold text-white transition-all",
              active ? "px-4" : "w-12",
            )}
          >
            <Search className="h-4 w-4" strokeWidth={3} />
            {active && <span>Search</span>}
          </button>
        </div>
      </form>

      {active === "where" && (
        <div className="animate-fade-in absolute top-[calc(100%+12px)] left-0 z-50 w-[425px] rounded-3xl bg-white py-6 shadow-float">
          <p className="px-8 pb-2 text-xs font-semibold text-gray-700">Suggested destinations</p>
          <ul>
            <li>
              <DestinationRow
                emoji="🧭"
                name="I'm flexible"
                subtitle="Show places everywhere"
                onClick={() => {
                  set({ location: "" });
                  onActiveChange("checkIn");
                }}
              />
            </li>
            {POPULAR_DESTINATIONS.map((d) => (
              <li key={d.name}>
                <DestinationRow
                  {...d}
                  onClick={() => {
                    set({ location: d.name });
                    onActiveChange("checkIn");
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {(active === "checkIn" || active === "checkOut") && (
        <div className="animate-fade-in absolute top-[calc(100%+12px)] left-1/2 z-50 w-[850px] -translate-x-1/2 rounded-3xl bg-white px-10 py-8 shadow-float">
          <RangeCalendar
            checkIn={draft.checkIn}
            checkOut={draft.checkOut}
            onChange={(checkIn, checkOut) => {
              set({ checkIn, checkOut });
              onActiveChange(checkOut ? "who" : "checkOut");
            }}
          />
        </div>
      )}

      {active === "who" && (
        <div className="animate-fade-in absolute top-[calc(100%+12px)] right-0 z-50 w-[425px] rounded-3xl bg-white px-8 py-4 shadow-float">
          <GuestFields value={draft} onChange={(g) => set(g)} />
        </div>
      )}
    </div>
  );
}

function DestinationRow({
  emoji,
  name,
  subtitle,
  onClick,
}: {
  emoji: string;
  name: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 px-8 py-2.5 text-left hover:bg-gray-100">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">{emoji}</span>
      <span>
        <span className="block text-[15px] text-gray-900">{name}</span>
        <span className="block text-sm text-gray-500">{subtitle}</span>
      </span>
    </button>
  );
}
