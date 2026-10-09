"use client";

import { Check, IdCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/cn";

export function AccountView() {
  const { user, users, switchUser } = useUser();
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-[32px] font-semibold">Account</h1>
      {user && (
        <div className="mt-6 grid gap-6 md:grid-cols-[300px_1fr]">
          <div className="rounded-3xl p-8 text-center shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
            <Avatar src={user.avatar_url} name={user.name} className="mx-auto h-24 w-24" />
            <div className="mt-3 text-2xl font-bold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.is_host ? (user.is_superhost ? "Superhost" : "Host") : "Guest"}</div>
            <div className="mt-1 text-sm text-gray-500">{user.email}</div>
          </div>
          <div className="space-y-4">
            {user.bio && <p className="text-gray-700">{user.bio}</p>}
            <div className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <IdCard className="h-6 w-6" />
                <h2 className="text-lg font-semibold">Identity verification</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 uppercase">Coming soon</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Verify your identity with a government ID to unlock instant booking and earn a verified badge.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast("Identity verification is coming soon")}>
                <ShieldCheck className="h-4 w-4" /> Verify identity
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/trips" className="underline">Trips</Link>
              <Link href="/wishlists" className="underline">Wishlists</Link>
              <Link href="/host" className="underline">{user.is_host ? "Host dashboard" : "Become a host"}</Link>
            </div>
          </div>
        </div>
      )}
      <h2 className="mt-12 mb-4 text-xl font-semibold">Switch demo account</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => u.id !== user?.id && switchUser(u.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                u.id === user?.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-900",
              )}
            >
              <Avatar src={u.avatar_url} name={u.name} className="h-10 w-10" />
              <span className="flex-1">
                <span className="block font-semibold">{u.name}</span>
                <span className="block text-sm text-gray-500">{u.is_host ? (u.is_superhost ? "Superhost" : "Host") : "Guest"}</span>
              </span>
              {u.id === user?.id && <Check className="h-5 w-5 text-brand" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
