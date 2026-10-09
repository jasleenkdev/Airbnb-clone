"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, errorMessage } from "@/lib/api";
import { useUser } from "@/hooks/useUser";

interface WishlistContextValue {
  ids: Set<number>;
  isSaved: (id: number) => boolean;
  toggle: (id: number, title?: string) => Promise<void>;
  version: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .wishlist()
      .then((items) => !cancelled && setIds(new Set(items.map((i) => i.id))))
      .catch(() => !cancelled && setIds(new Set()));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (id: number, title?: string) => {
      if (!user) {
        toast.error("Pick a user from the menu to save places.");
        return;
      }
      const saved = ids.has(id);
      // Optimistic update, rolled back on failure.
      setIds((prev) => {
        const next = new Set(prev);
        if (saved) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (saved) await api.removeFromWishlist(id);
        else await api.addToWishlist(id);
        setVersion((v) => v + 1);
        toast.success(saved ? "Removed from wishlist" : `Saved${title ? ` “${title}”` : ""} to wishlist`);
      } catch (err) {
        setIds((prev) => {
          const next = new Set(prev);
          if (saved) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error(errorMessage(err));
      }
    },
    [ids, user],
  );

  const value = useMemo(() => ({ ids, isSaved: (id: number) => ids.has(id), toggle, version }), [ids, toggle, version]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
