"use client";

import { useCallback, useEffect, useState } from "react";

import { errorMessage } from "@/lib/api";

/** Minimal client-side data loader: refetches when `key` changes; `reload()` refetches on demand. */
export function useFetch<T>(fetcher: () => Promise<T>, key: unknown[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetcher()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...key, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading: loading && data === null && error === null, reload, setData };
}
