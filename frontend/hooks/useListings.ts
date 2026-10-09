"use client";

import { useCallback, useEffect, useState } from "react";

import { api, errorMessage } from "@/lib/api";
import type { ListingCard, ListingQuery } from "@/types";

const PAGE_SIZE = 20;

/**
 * Paginated listing search. The caller should remount (via `key`) when the query changes,
 * so state always starts fresh for a new search.
 */
export function useListings(query: ListingQuery) {
  const [items, setItems] = useState<ListingCard[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.listings({ ...query, page: nextPage, page_size: PAGE_SIZE });
        setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
        setPage(res.page);
        setPages(res.pages);
        setTotal(res.total);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(query)],
  );

  useEffect(() => {
    // Data fetching on mount; state updates happen after the await.
    void load(1);
  }, [load]);

  const hasMore = page < pages;
  const loadMore = useCallback(() => {
    if (!loading && hasMore) void load(page + 1);
  }, [hasMore, load, loading, page]);

  return { items, total, loading, error, hasMore, loadMore, retry: () => load(page + 1 || 1) };
}
