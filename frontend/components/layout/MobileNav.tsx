"use client";

import { Heart, MessageSquare, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "@/components/layout/Logo";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Explore", icon: Search },
  { href: "/wishlists", label: "Wishlists", icon: Heart },
  { href: "/trips", label: "Trips", icon: LogoMark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/account", label: "Profile", icon: UserCircle },
] as const;

/** Airbnb-app style bottom tab bar (mobile only). */
export function MobileNav() {
  const pathname = usePathname();
  // Pages with their own fixed bottom action bar hide the tab bar, like the Airbnb app.
  if (["/rooms/", "/book/", "/host/listings/"].some((p) => pathname.startsWith(p))) return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-semibold",
                  active ? "text-brand" : "text-gray-500",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

