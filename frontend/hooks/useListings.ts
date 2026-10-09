"use client";

import { useCallback, useEffect, useState } from "react";

import { api, errorMessage } from "@/lib/api";
import type { ListingCard, ListingQuery } from "@/types";

const PAGE_SIZE = 20;

interface State {
  items: ListingCard[];
  page: number;
  pages: number;
  total: number;
  loading: boolean;
  error: string | null;
}

/**
 * Paginated listing search ("Show more" / infinite scroll). The caller should remount
 * (via `key`) when the query changes, so state always starts fresh for a new search.
 */
export function useListings(query: ListingQuery) {
  const queryKey = JSON.stringify(query);
  const [state, setState] = useState<State>({ items: [], page: 0, pages: 1, total: 0, loading: true, error: null });
  const [request, setRequest] = useState({ page: 1, attempt: 0 });

  useEffect(() => {
    let cancelled = false;
    api
      .listings({ ...(JSON.parse(queryKey) as ListingQuery), page: request.page, page_size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setState((s) => ({
          items: request.page === 1 ? res.items : [...s.items, ...res.items],
          page: res.page,
          pages: res.pages,
          total: res.total,
          loading: false,
          error: null,
        }));
      })
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: errorMessage(err) })));
    return () => {
      cancelled = true;
    };
  }, [queryKey, request]);

  const hasMore = state.page < state.pages;

  const loadMore = useCallback(() => {
    if (state.loading || !hasMore) return;
    setState((s) => ({ ...s, loading: true }));
    setRequest({ page: state.page + 1, attempt: 0 });
  }, [hasMore, state.loading, state.page]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setRequest((r) => ({ page: r.page, attempt: r.attempt + 1 }));
  }, []);

  return { ...state, hasMore, loadMore, retry };
}
