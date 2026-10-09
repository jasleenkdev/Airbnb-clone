"use client";

import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import type { Category } from "@/types";

interface CategoryBarProps {
  categories: Category[];
  active: string | null;
  onSelect: (slug: string | null) => void;
  filterCount: number;
  onOpenFilters: () => void;
}

export function CategoryBar({ categories, active, onSelect, filterCount, onOpenFilters }: CategoryBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateEdges());
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories.length]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm transition hover:scale-105 hover:shadow md:flex";

  return (
    <div className="flex items-center gap-6">
      <div className="relative min-w-0 flex-1">
        {!edges.start && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-white to-transparent" />
            <button type="button" aria-label="Scroll categories left" onClick={() => scroll(-1)} className={cn(arrow, "left-0")}>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          role="tablist"
          aria-label="Categories"
          className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth md:gap-10"
        >
          {categories.map((c) => {
            const isActive = active === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(isActive ? null : c.slug)}
                className={cn(
                  "group flex shrink-0 flex-col items-center gap-2 border-b-2 pt-3 pb-3 text-xs font-semibold transition",
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900",
                )}
              >
                <Icon name={c.icon} className="h-6 w-6" strokeWidth={isActive ? 2 : 1.6} />
                <span className="whitespace-nowrap">{c.label}</span>
              </button>
            );
          })}
        </div>
        {!edges.end && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-white to-transparent" />
            <button type="button" aria-label="Scroll categories right" onClick={() => scroll(1)} className={cn(arrow, "right-0")}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={filterCount ? `Filters (${filterCount} active)` : "Filters"}
        className={cn(
          "relative flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3.5 text-xs font-semibold transition hover:border-gray-900 hover:bg-gray-50",
          filterCount ? "border-gray-900 bg-gray-50" : "border-gray-300",
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {filterCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white">
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
}
