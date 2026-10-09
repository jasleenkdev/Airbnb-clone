"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { POPULAR_DESTINATIONS } from "@/components/search/destinations";
import { GuestFields } from "@/components/search/GuestFields";
import type { SearchDraft } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RangeCalendar } from "@/components/ui/RangeCalendar";
import { cn } from "@/lib/cn";
import { formatRange } from "@/lib/format";
import { EMPTY_GUESTS, guestSummary } from "@/lib/search";

type Step = "where" | "when" | "who";

interface MobileSearchProps {
  open: boolean;
  onClose: () => void;
  draft: SearchDraft;
  onDraftChange: (d: SearchDraft) => void;
  onSubmit: () => void;
}

export function MobileSearch({ open, onClose, draft, onDraftChange, onSubmit }: MobileSearchProps) {
  const [step, setStep] = useState<Step>("where");
  const set = (patch: Partial<SearchDraft>) => onDraftChange({ ...draft, ...patch });

  const card = (key: Step, label: string, summary: string, children: React.ReactNode) => (
    <section className={cn("rounded-2xl border border-gray-200 bg-white", step === key ? "p-5 shadow-card" : "")}>
      {step === key ? (
        <>
          <h3 className="mb-4 text-2xl font-bold">{label}</h3>
          {children}
        </>
      ) : (
        <button type="button" onClick={() => setStep(key)} className="flex w-full justify-between p-4 text-sm">
          <span className="text-gray-500">{label}</span>
          <span className="font-semibold">{summary}</span>
        </button>
      )}
    </section>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      bodyClassName="bg-gray-50 space-y-3 px-4"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => onDraftChange({ location: "", checkIn: null, checkOut: null, ...EMPTY_GUESTS })}
          >
            Clear all
          </button>
          <Button variant="brand" size="lg" onClick={onSubmit}>
            <Search className="h-4 w-4" strokeWidth={3} /> Search
          </Button>
        </div>
      }
    >
      {card(
        "where",
        "Where to?",
        draft.location || "I'm flexible",
        <>
          <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3">
            <Search className="h-4 w-4" />
            <input
              value={draft.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Search destinations"
              className="w-full bg-transparent outline-none"
              aria-label="Destination"
            />
          </div>
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {POPULAR_DESTINATIONS.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => {
                  set({ location: d.name });
                  setStep("when");
                }}
                className="shrink-0 rounded-full border border-gray-300 px-4 py-2 text-sm"
              >
                {d.emoji} {d.name}
              </button>
            ))}
          </div>
        </>,
      )}
      {card(
        "when",
        "When's your trip?",
        draft.checkIn && draft.checkOut ? formatRange(draft.checkIn, draft.checkOut) : "Add dates",
        <RangeCalendar
          months={1}
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          onChange={(checkIn, checkOut) => {
            set({ checkIn, checkOut });
            if (checkOut) setStep("who");
          }}
        />,
      )}
      {card("who", "Who's coming?", guestSummary(draft) || "Add guests", <GuestFields value={draft} onChange={(g) => set(g)} />)}
    </Modal>
  );
}
