"use client";

import { List, Map as MapIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { GRID_CLASSES, ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import { ListingsMap } from "@/components/listing/maps";
import { CategoryBar } from "@/components/search/CategoryBar";
import { FiltersModal } from "@/components/search/FiltersModal";
import { Button } from "@/components/ui/Button";
import { useListings } from "@/hooks/useListings";
import { api } from "@/lib/api";
import { activeFilterCount, parseSearch, type SearchState, searchHref, toListingQuery, totalGuests } from "@/lib/search";
import type { Category, ListingCard as Listing } from "@/types";

export function ExploreView() {
  const params = useSearchParams();
  const router = useRouter();
  const state = useMemo(() => parseSearch(params), [params]);
  const query = useMemo(() => toListingQuery(state), [state]);
  const queryKey = JSON.stringify(query);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  const navigate = (next: SearchState) => router.push(searchHref(next), { scroll: false });

  // Forward dates and guests to the listing page so the booking card is prefilled.
  const linkQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (state.checkIn && state.checkOut) {
      p.set("check_in", state.checkIn);
      p.set("check_out", state.checkOut);
    }
    const g = totalGuests(state);
    if (g) p.set("guests", String(g));
    return p.toString();
  }, [state]);

  return (
    <>
      <div className="sticky top-20 z-30 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-[1760px] px-6 pt-2 md:px-10 xl:px-20">
          <CategoryBar
            categories={categories}
            active={state.category}
            onSelect={(category) => navigate({ ...state, category })}
            filterCount={activeFilterCount(state)}
            onOpenFilters={() => setFiltersOpen(true)}
          />
        </div>
      </div>

      {showMap ? (
        <MapResults query={query} />
      ) : (
        <ExploreResults
          key={queryKey}
          state={state}
          linkQuery={linkQuery}
          onClear={() => router.push("/")}
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center md:bottom-10">
        <button
          type="button"
          onClick={() => setShowMap((m) => !m)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white shadow-float transition hover:scale-105"
        >
          {showMap ? (
            <>
              Show list <List className="h-4 w-4" />
            </>
          ) : (
            <>
              Show map <MapIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} state={state} onApply={navigate} />
    </>
  );
}

function ExploreResults({ state, linkQuery, onClear }: { state: SearchState; linkQuery: string; onClear: () => void }) {
  const query = useMemo(() => toListingQuery(state), [state]);
  const { items, total, loading, error, hasMore, loadMore, retry } = useListings(query);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [autoLoads, setAutoLoads] = useState(0);

  // Infinite scroll for the first couple of pages, then an explicit "Show more" button (like Airbnb).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || autoLoads >= 2) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAutoLoads((n) => n + 1);
          loadMore();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, autoLoads]);

  const searching = !!(state.location || state.checkIn || state.category || activeFilterCount(state));

  return (
    <div className="mx-auto max-w-[1760px] px-6 pt-6 pb-16 md:px-10 xl:px-20">
      {searching && !loading && items.length > 0 && (
        <p className="mb-6 text-sm font-semibold">
          {total === 1 ? "1 place" : `${total} places`}
          {state.location ? ` in ${state.location}` : ""}
        </p>
      )}

      {error && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 ? (
        <div className="py-24 text-center">
          <h2 className="text-2xl font-semibold">No exact matches</h2>
          <p className="mt-2 text-gray-600">Try changing or removing some of your filters or adjusting your search area.</p>
          <Button variant="outline" className="mt-6" onClick={onClear}>
            Remove all filters
          </Button>
        </div>
      ) : (
        <div className={GRID_CLASSES}>
          {items.map((l: Listing) => (
            <ListingCard key={l.id} listing={l} checkIn={state.checkIn} checkOut={state.checkOut} linkQuery={linkQuery} />
          ))}
          {loading && Array.from({ length: items.length ? 5 : 15 }, (_, i) => <ListingCardSkeleton key={`s${i}`} />)}
        </div>
      )}

      <div ref={sentinelRef} />
      {hasMore && !loading && autoLoads >= 2 && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">Continue exploring amazing places</p>
          <Button variant="dark" onClick={loadMore}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}

function MapResults({ query }: { query: ReturnType<typeof toListingQuery> }) {
  const [items, setItems] = useState<Listing[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .listings({ ...query, page_size: 48 })
      .then((p) => !cancelled && setItems(p.items))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [query]);
  return (
    <div className="isolate h-[calc(100dvh-80px-88px)]">
      {items ? <ListingsMap listings={items} /> : <div className="h-full animate-pulse bg-gray-100" />}
    </div>
  );
}
