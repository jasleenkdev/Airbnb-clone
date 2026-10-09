"use client";

import { Globe, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/layout/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileSearch } from "@/components/search/MobileSearch";
import { SearchBar, type SearchDraft, type Segment } from "@/components/search/SearchBar";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/cn";
import { formatRange } from "@/lib/format";
import { guestSummary, parseSearch, searchHref } from "@/lib/search";

export function HeaderFallback() {
  return <div className="h-20 border-b border-gray-200 bg-white" />;
}

export function Header() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  // Only the explore page carries search state in its URL.
  const current = parseSearch(pathname === "/" ? params : new URLSearchParams());
  const routeKey = `${pathname}?${params.toString()}`;

  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<Segment | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState<SearchDraft>(current);
  const [seenRoute, setSeenRoute] = useState(routeKey);

  // Collapse and resync the draft whenever the route changes (adjusting state during render, not in an effect).
  if (seenRoute !== routeKey) {
    setSeenRoute(routeKey);
    setExpanded(false);
    setActive(null);
    setDraft(current);
  }

  const open = (segment: Segment) => {
    setDraft(current);
    setExpanded(true);
    setActive(segment);
  };
  const close = () => {
    setExpanded(false);
    setActive(null);
  };

  const submit = (d: SearchDraft = draft) => {
    close();
    setMobileOpen(false);
    router.push(searchHref({ ...current, ...d }));
  };

  const hasDates = current.checkIn && current.checkOut;
  const guests = guestSummary(current);
  const isHome = pathname === "/";

  return (
    <>
      <header
        className={cn(
          "z-40 border-b border-gray-200 bg-white",
          isHome ? "sticky top-0" : "relative md:sticky md:top-0",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-6 transition-[height] md:px-10 xl:px-20",
            expanded ? "md:h-[88px]" : "h-20",
          )}
        >
          <div className="hidden flex-1 md:flex">
            <Logo />
          </div>

          {/* Mobile: single "Where to?" pill */}
          <button
            type="button"
            onClick={() => {
              setDraft(current);
              setMobileOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-full border border-gray-200 px-5 py-2.5 text-left shadow-pill md:hidden"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{current.location || "Where to?"}</span>
              <span className="block truncate text-xs text-gray-500">
                {[hasDates ? formatRange(current.checkIn!, current.checkOut!) : "Any week", guests || "Add guests"].join(
                  " · ",
                )}
              </span>
            </span>
          </button>

          {/* Desktop: compact pill or Stays/Experiences tabs when expanded */}
          <div className="hidden justify-center md:flex">
            {expanded ? (
              <nav className="flex gap-8 text-base" aria-label="Search type">
                <span className="border-b-2 border-gray-900 pb-1 font-semibold">Stays</span>
                <button
                  type="button"
                  className="pb-1 text-gray-500 hover:text-gray-900"
                  onClick={() => toast("Experiences are coming soon")}
                >
                  Experiences
                </button>
              </nav>
            ) : (
              <div className="flex h-12 items-center rounded-full border border-gray-200 text-sm shadow-pill transition hover:shadow-card">
                <button type="button" onClick={() => open("where")} className="truncate pr-4 pl-6 font-semibold">
                  {current.location || "Anywhere"}
                </button>
                <span className="h-6 w-px bg-gray-300" />
                <button type="button" onClick={() => open("checkIn")} className="truncate px-4 font-semibold">
                  {hasDates ? formatRange(current.checkIn!, current.checkOut!) : "Any week"}
                </button>
                <span className="h-6 w-px bg-gray-300" />
                <button
                  type="button"
                  onClick={() => open("who")}
                  className={cn("flex items-center gap-3 pr-2 pl-4", guests ? "font-semibold" : "text-gray-500")}
                >
                  <span className="truncate">{guests || "Add guests"}</span>
                  <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-white">
                    <Search className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
            <Link
              href="/host"
              className="hidden rounded-full px-4 py-3 text-sm font-semibold whitespace-nowrap hover:bg-gray-100 lg:block"
            >
              {user?.is_host ? "Switch to hosting" : "Airbnb your home"}
            </Link>
            <button
              type="button"
              aria-label="Choose a language and currency"
              onClick={() => toast("Language and region settings are coming soon")}
              className="rounded-full p-3 hover:bg-gray-100"
            >
              <Globe className="h-4 w-4" />
            </button>
            <UserMenu />
          </div>
        </div>

        {expanded && (
          <div className="hidden px-6 pb-5 md:block">
            <SearchBar
              draft={draft}
              onDraftChange={setDraft}
              active={active}
              onActiveChange={setActive}
              onSubmit={() => submit()}
            />
          </div>
        )}
      </header>

      {expanded && (
        <div className="animate-fade-in fixed inset-0 z-[35] hidden bg-black/25 md:block" onClick={close} aria-hidden />
      )}

      <MobileSearch
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => submit()}
      />
    </>
  );
}
