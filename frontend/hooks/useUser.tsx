"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, errorMessage, setApiUser } from "@/lib/api";
import type { User } from "@/types";

const STORAGE_KEY = "airbnb-clone:user-id";
const DEFAULT_USER_EMAIL = "aisha@example.com"; // start as a guest

interface UserContextValue {
  user: User | null;
  users: User[];
  ready: boolean;
  switchUser: (id: number) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function readStoredId(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .users()
      .then((list) => {
        if (cancelled) return;
        const stored = readStoredId();
        const initial =
          list.find((u) => u.id === stored) ?? list.find((u) => u.email === DEFAULT_USER_EMAIL) ?? list[0];
        setUsers(list);
        setApiUser(initial?.id ?? null);
        setUserId(initial?.id ?? null);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const switchUser = useCallback(
    (id: number) => {
      setApiUser(id);
      setUserId(id);
      try {
        localStorage.setItem(STORAGE_KEY, String(id));
      } catch {
        /* storage unavailable: switching still works for this tab */
      }
      const next = users.find((u) => u.id === id);
      if (next) toast.success(`Signed in as ${next.name}${next.is_host ? " (host)" : ""}`);
    },
    [users],
  );

  const value = useMemo(
    () => ({ user: users.find((u) => u.id === userId) ?? null, users, ready, switchUser }),
    [users, userId, ready, switchUser],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
