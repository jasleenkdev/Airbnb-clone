import type { ListingQuery } from "@/types";

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface SearchState extends GuestCounts {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  types: string[];
  amenities: number[];
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export const EMPTY_GUESTS: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };

type ParamsLike = { get(name: string): string | null };

const int = (v: string | null, fallback = 0) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};
const optInt = (v: string | null) => (v == null || v === "" ? null : int(v));
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function parseSearch(params: ParamsLike): SearchState {
  return {
    location: params.get("location") ?? "",
    checkIn: params.get("check_in"),
    checkOut: params.get("check_out"),
    adults: int(params.get("adults")),
    children: int(params.get("children")),
    infants: int(params.get("infants")),
    pets: int(params.get("pets")),
    category: params.get("category"),
    minPrice: optInt(params.get("min_price")),
    maxPrice: optInt(params.get("max_price")),
    types: list(params.get("property_type")),
    amenities: list(params.get("amenities")).map(Number).filter(Number.isFinite),
    bedrooms: int(params.get("min_bedrooms")),
    beds: int(params.get("min_beds")),
    bathrooms: int(params.get("min_bathrooms")),
  };
}

/** Guests that count toward capacity (Airbnb doesn't count infants or pets). */
export const totalGuests = (g: GuestCounts) => g.adults + g.children;

export function toListingQuery(s: SearchState): ListingQuery {
  const guests = totalGuests(s);
  return {
    location: s.location || undefined,
    check_in: s.checkIn && s.checkOut ? s.checkIn : undefined,
    check_out: s.checkIn && s.checkOut ? s.checkOut : undefined,
    guests: guests || undefined,
    category: s.category || undefined,
    min_price: s.minPrice ?? undefined,
    max_price: s.maxPrice ?? undefined,
    property_type: s.types.length ? s.types.join(",") : undefined,
    amenities: s.amenities.length ? s.amenities.join(",") : undefined,
    min_bedrooms: s.bedrooms || undefined,
    min_beds: s.beds || undefined,
    min_bathrooms: s.bathrooms || undefined,
  };
}

export function toUrlParams(s: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: string | number | null | undefined) => {
    if (v !== null && v !== undefined && v !== "" && v !== 0) p.set(k, String(v));
  };
  set("location", s.location);
  if (s.checkIn && s.checkOut) {
    set("check_in", s.checkIn);
    set("check_out", s.checkOut);
  }
  set("adults", s.adults);
  set("children", s.children);
  set("infants", s.infants);
  set("pets", s.pets);
  set("category", s.category);
  set("min_price", s.minPrice);
  set("max_price", s.maxPrice);
  set("property_type", s.types.join(","));
  set("amenities", s.amenities.join(","));
  set("min_bedrooms", s.bedrooms);
  set("min_beds", s.beds);
  set("min_bathrooms", s.bathrooms);
  return p;
}

export function searchHref(s: SearchState): string {
  const qs = toUrlParams(s).toString();
  return qs ? `/?${qs}` : "/";
}

export function activeFilterCount(s: SearchState): number {
  return (
    (s.minPrice != null || s.maxPrice != null ? 1 : 0) +
    s.types.length +
    s.amenities.length +
    (s.bedrooms ? 1 : 0) +
    (s.beds ? 1 : 0) +
    (s.bathrooms ? 1 : 0)
  );
}

export function guestSummary(g: GuestCounts): string {
  const total = totalGuests(g);
  if (!total) return "";
  const parts = [`${total} guest${total === 1 ? "" : "s"}`];
  if (g.infants) parts.push(`${g.infants} infant${g.infants === 1 ? "" : "s"}`);
  if (g.pets) parts.push(`${g.pets} pet${g.pets === 1 ? "" : "s"}`);
  return parts.join(", ");
}
