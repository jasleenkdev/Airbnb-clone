"use client";

import { differenceInYears, parseISO } from "date-fns";
import { BadgeCheck, Medal, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { rating } from "@/lib/format";
import type { Host } from "@/types";

export function yearsHosting(host: Host) {
  return Math.max(1, differenceInYears(new Date(), parseISO(host.created_at)));
}

export function HostSection({ host }: { host: Host }) {
  const years = yearsHosting(host);
  return (
    <section className="border-t border-gray-200 py-12">
      <h2 className="mb-8 text-[22px] font-semibold">Meet your host</h2>
      <div className="grid gap-10 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        <div className="flex items-center gap-6 self-start rounded-3xl bg-white px-8 py-8 shadow-[0_6px_20px_rgba(0,0,0,0.15)]">
          <div className="flex flex-1 flex-col items-center text-center">
            <div className="relative">
              <Avatar src={host.avatar_url} name={host.name} className="h-24 w-24" />
              {host.is_superhost && (
                <span className="bg-brand-gradient absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full text-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>
            <div className="mt-3 text-[28px] leading-8 font-bold">{host.name.split(" ")[0]}</div>
            <div className="flex items-center gap-1 text-sm font-semibold">
              {host.is_superhost ? (
                <>
                  <Medal className="h-4 w-4" /> Superhost
                </>
              ) : (
                "Host"
              )}
            </div>
          </div>
          <dl className="w-24 divide-y divide-gray-200 text-left">
            <div className="pb-3">
              <dd className="text-[22px] leading-6 font-bold">{host.review_count}</dd>
              <dt className="text-xs font-semibold">Reviews</dt>
            </div>
            <div className="py-3">
              <dd className="flex items-center gap-1 text-[22px] leading-6 font-bold">
                {rating(host.avg_rating)} <Star className="h-3.5 w-3.5 fill-current" />
              </dd>
              <dt className="text-xs font-semibold">Rating</dt>
            </div>
            <div className="pt-3">
              <dd className="text-[22px] leading-6 font-bold">{years}</dd>
              <dt className="text-xs font-semibold">{years === 1 ? "Year" : "Years"} hosting</dt>
            </div>
          </dl>
        </div>
        <div>
          {host.is_superhost && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold">{host.name.split(" ")[0]} is a Superhost</h3>
              <p className="mt-1 text-gray-700">
                Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.
              </p>
            </div>
          )}
          {host.bio && <p className="mb-6 leading-6 text-gray-700">{host.bio}</p>}
          <h3 className="text-lg font-semibold">Host details</h3>
          <p className="mt-1 text-gray-700">Response rate: 100%</p>
          <p className="text-gray-700">Responds within an hour</p>
          <Button variant="dark" className="mt-6" onClick={() => toast("Messaging is coming soon")}>
            Message host
          </Button>
          <p className="mt-6 flex items-start gap-3 border-t border-gray-200 pt-6 text-xs text-gray-600">
            <BadgeCheck className="h-6 w-6 shrink-0 text-brand" />
            To help protect your payment, always use Airbnb to send money and communicate with hosts.
          </p>
        </div>
      </div>
    </section>
  );
}
