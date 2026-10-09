import type {
  Amenity,
  BookedRange,
  Booking,
  Category,
  ListingCard,
  ListingDetail,
  ListingInput,
  ListingQuery,
  Page,
  PriceHistogram,
  PriceQuote,
  Review,
  ReviewInput,
  User,
} from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

/** Mock auth: the active user id is kept here (and in localStorage by UserProvider). */
let currentUserId: number | null = null;
export function setApiUser(id: number | null) {
  currentUserId = id;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FastApiDetail = string | { msg: string; loc?: (string | number)[] }[] | undefined;

function detailToMessage(detail: FastApiDetail, fallback: string): string {
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  return detail.map((d) => d.msg.replace(/^Value error, /, "")).join(". ");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (currentUserId != null) headers.set("X-User-Id", String(currentUserId));

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the API running?");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, detailToMessage(data?.detail, `Request failed (${res.status})`));
  }
  return data as T;
}

export function toQueryString(params: object): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  users: () => request<User[]>("/users"),

  listings: (q: ListingQuery = {}) => request<Page<ListingCard>>(`/listings${toQueryString(q)}`),
  priceHistogram: (q: ListingQuery = {}) => request<PriceHistogram>(`/listings/price-histogram${toQueryString(q)}`),
  listing: (id: number | string) => request<ListingDetail>(`/listings/${id}`),
  availability: (id: number | string) => request<BookedRange[]>(`/listings/${id}/availability`),
  quote: (id: number | string, check_in: string, check_out: string) =>
    request<PriceQuote>(`/listings/${id}/quote${toQueryString({ check_in, check_out })}`),
  reviews: (id: number | string) => request<Review[]>(`/listings/${id}/reviews`),
  createListing: (data: ListingInput) => request<ListingDetail>("/listings", { method: "POST", body: json(data) }),
  updateListing: (id: number, data: ListingInput) =>
    request<ListingDetail>(`/listings/${id}`, { method: "PUT", body: json(data) }),
  deleteListing: (id: number) => request<void>(`/listings/${id}`, { method: "DELETE" }),

  createBooking: (data: { listing_id: number; check_in: string; check_out: string; guests: number }) =>
    request<Booking>("/bookings", { method: "POST", body: json(data) }),
  booking: (id: number | string) => request<Booking>(`/bookings/${id}`),
  myBookings: () => request<Booking[]>("/bookings/me"),
  cancelBooking: (id: number) => request<Booking>(`/bookings/${id}/cancel`, { method: "PATCH" }),

  hostListings: () => request<ListingCard[]>("/host/listings"),
  hostBookings: () => request<Booking[]>("/host/bookings"),

  createReview: (data: ReviewInput) => request<Review>("/reviews", { method: "POST", body: json(data) }),

  wishlist: () => request<ListingCard[]>("/wishlist"),
  addToWishlist: (listingId: number) => request<unknown>(`/wishlist/${listingId}`, { method: "POST" }),
  removeFromWishlist: (listingId: number) => request<void>(`/wishlist/${listingId}`, { method: "DELETE" }),

  amenities: () => request<Amenity[]>("/amenities"),
  categories: () => request<Category[]>("/categories"),
};

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
