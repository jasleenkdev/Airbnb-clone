"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { HostBookings } from "@/components/host/HostBookings";
import { HostListings } from "@/components/host/HostListings";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { money, rating } from "@/lib/format";

type Tab = "upcoming" | "past" | "cancelled" | "listings";

export function HostDashboard() {
  const { user, users, ready, switchUser } = useUser();
  const isHost = !!user?.is_host;
  const listings = useFetch(() => api.hostListings(), [user?.id], ready && isHost);
  const bookings = useFetch(() => api.hostBookings(), [user?.id], ready && isHost);
  const [tab, setTab] = useState<Tab>("upcoming");

  if (!ready) return <div className="mx-auto max-w-[1280px] px-6 py-10"><Skeleton className="h-64" /></div>;

  if (!isHost) {
    const hosts = users.filter((u) => u.is_host);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl leading-tight font-semibold">
          Airbnb it.
          <br />
          You could earn on Airbnb.
        </h1>
        <p className="mt-4 text-gray-600">
          You&apos;re signed in as a guest. This demo uses mock accounts: switch to a host to manage listings and see incoming reservations.
        </p>
        <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
          {hosts.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => switchUser(h.id)}
              className="flex items-center gap-3 rounded-xl border border-gray-300 p-4 text-left transition hover:border-gray-900"
            >
              <Avatar src={h.avatar_url} name={h.name} className="h-10 w-10" />
              <span>
                <span className="block font-semibold">{h.name}</span>
                <span className="block text-sm text-gray-500">{h.is_superhost ? "Superhost" : "Host"}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const all = bookings.data ?? [];
  const groups = {
    upcoming: all.filter((b) => b.status === "confirmed").sort((a, b) => a.check_in.localeCompare(b.check_in)),
    past: all.filter((b) => b.status === "completed"),
    cancelled: all.filter((b) => b.status === "cancelled"),
  };
  const earnings = all.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.total_price - b.service_fee, 0);
  const rated = (listings.data ?? []).filter((l) => l.avg_rating != null);
  const avg = rated.length ? rated.reduce((s, l) => s + (l.avg_rating ?? 0) * l.review_count, 0) / rated.reduce((s, l) => s + l.review_count, 0) : null;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "upcoming", label: "Upcoming", count: groups.upcoming.length },
    { key: "past", label: "Completed", count: groups.past.length },
    { key: "cancelled", label: "Cancelled", count: groups.cancelled.length },
    { key: "listings", label: "Your listings", count: listings.data?.length },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold">Welcome back, {user!.name.split(" ")[0]}</h1>
          <p className="text-gray-600">{user!.is_superhost ? "Superhost · " : ""}Here&apos;s what&apos;s happening with your places.</p>
        </div>
        <Link href="/host/listings/new" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-black">
          <Plus className="h-4 w-4" /> Create listing
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active listings" value={listings.data ? String(listings.data.length) : "–"} />
        <Stat label="Upcoming reservations" value={bookings.data ? String(groups.upcoming.length) : "–"} />
        <Stat label="Total payouts" value={bookings.data ? money(earnings) : "–"} />
        <Stat label="Overall rating" value={listings.data ? `★ ${rating(avg)}` : "–"} />
      </div>

      <div role="tablist" className="no-scrollbar mt-10 flex gap-6 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition",
              tab === t.key ? "border-gray-900" : "border-transparent text-gray-500 hover:text-gray-900",
            )}
          >
            {t.label} {t.count != null && <span className="text-gray-400">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "listings" ? (
          listings.data ? <HostListings listings={listings.data} onChanged={listings.reload} /> : <Skeleton className="h-64 rounded-2xl" />
        ) : bookings.data ? (
          <HostBookings
            bookings={groups[tab]}
            empty={tab === "upcoming" ? "No upcoming reservations yet." : tab === "past" ? "No completed stays yet." : "No cancellations."}
          />
        ) : (
          <Skeleton className="h-48 rounded-2xl" />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
