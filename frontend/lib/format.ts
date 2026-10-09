import { differenceInCalendarDays, format, isSameMonth, isSameYear, parseISO } from "date-fns";

export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** "yyyy-MM-dd" in local time (never use toISOString for calendar dates: it shifts by timezone). */
export const toISODate = (d: Date) => format(d, "yyyy-MM-dd");
export const fromISODate = (s: string) => parseISO(s);

export function nightsBetween(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));
}

/** "Oct 12 – 15", "Oct 30 – Nov 2", "Dec 30, 2026 – Jan 2, 2027" */
export function formatRange(checkIn: string, checkOut: string): string {
  const a = parseISO(checkIn);
  const b = parseISO(checkOut);
  if (!isSameYear(a, b)) return `${format(a, "MMM d, yyyy")} – ${format(b, "MMM d, yyyy")}`;
  if (isSameMonth(a, b)) return `${format(a, "MMM d")} – ${format(b, "d")}`;
  return `${format(a, "MMM d")} – ${format(b, "MMM d")}`;
}

export const shortDate = (s: string) => format(parseISO(s), "MMM d");
export const longDate = (s: string) => format(parseISO(s), "EEE, MMM d, yyyy");

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;

export const rating = (r: number | null | undefined) => (r == null ? "New" : r.toFixed(r % 1 === 0 ? 1 : 2));

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  cabin: "Cabin",
  villa: "Villa",
  cottage: "Cottage",
  tiny_home: "Tiny home",
  treehouse: "Treehouse",
  beachfront: "Beachfront home",
};

export function locationLabel(l: { city: string; state?: string | null; country: string }) {
  return `${l.city}, ${l.country}`;
}
