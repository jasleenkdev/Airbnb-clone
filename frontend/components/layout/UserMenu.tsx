"use client";

import { Check, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { user, users, switchUser } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-gray-50";
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Main navigation menu"
        className="flex items-center gap-3 rounded-full border border-gray-300 py-1.5 pr-1.5 pl-3 transition hover:shadow-card"
      >
        <Menu className="h-4 w-4" strokeWidth={2.5} />
        {user ? (
          <Avatar src={user.avatar_url} name={user.name} className="h-8 w-8" />
        ) : (
          <span className="h-8 w-8 rounded-full bg-gray-500" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute top-[calc(100%+8px)] right-0 z-50 w-72 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-float"
        >
          {user && (
            <div className="px-4 pt-2 pb-3">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-gray-500">{user.is_host ? (user.is_superhost ? "Superhost" : "Host") : "Guest"}</div>
            </div>
          )}
          <Link href="/trips" className={cn(item, "font-semibold")} onClick={close} role="menuitem">
            Trips
          </Link>
          <Link href="/wishlists" className={cn(item, "font-semibold")} onClick={close} role="menuitem">
            Wishlists
          </Link>
          <Link href="/messages" className={cn(item, "font-semibold")} onClick={close} role="menuitem">
            Messages
          </Link>
          <hr className="my-2 border-gray-200" />
          <Link href="/host" className={item} onClick={close} role="menuitem">
            {user?.is_host ? "Host dashboard" : "Airbnb your home"}
          </Link>
          {user?.is_host && (
            <Link href="/host/listings/new" className={item} onClick={close} role="menuitem">
              Create a new listing
            </Link>
          )}
          <Link href="/account" className={item} onClick={close} role="menuitem">
            Account
          </Link>
          <hr className="my-2 border-gray-200" />
          <div className="px-4 pt-1 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Switch user</div>
          <div className="max-h-64 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                role="menuitemradio"
                aria-checked={u.id === user?.id}
                onClick={() => {
                  if (u.id !== user?.id) switchUser(u.id);
                  close();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                <Avatar src={u.avatar_url} name={u.name} className="h-7 w-7" />
                <span className="flex-1">
                  <span className="block">{u.name}</span>
                  <span className="block text-xs text-gray-500">
                    {u.is_host ? (u.is_superhost ? "Superhost" : "Host") : "Guest"}
                  </span>
                </span>
                {u.id === user?.id && <Check className="h-4 w-4 text-brand" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
