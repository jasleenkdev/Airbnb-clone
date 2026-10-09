export type PropertyType =
  | "house"
  | "apartment"
  | "cabin"
  | "villa"
  | "cottage"
  | "tiny_home"
  | "treehouse"
  | "beachfront";

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface UserBrief {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface User extends UserBrief {
  email: string;
  is_host: boolean;
  is_superhost: boolean;
  bio: string | null;
  created_at: string;
}

export interface Host extends User {
  listing_count: number;
  review_count: number;
  avg_rating: number | null;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export interface Category {
  slug: string;
  label: string;
  icon: string;
}

export interface ListingCard {
  id: number;
  title: string;
  property_type: PropertyType;
  category: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: string[];
  avg_rating: number | null;
  review_count: number;
  host_name: string;
  host_is_superhost: boolean;
}

export interface ListingImage {
  id: number;
  url: string;
  position: number;
}

export interface RatingSummary {
  avg_rating: number | null;
  review_count: number;
  cleanliness: number | null;
  accuracy: number | null;
  communication: number | null;
  location: number | null;
  check_in: number | null;
  value: number | null;
  distribution: Record<string, number>;
}

export interface ListingDetail {
  id: number;
  host_id: number;
  title: string;
  description: string;
  property_type: PropertyType;
  category: string;
  city: string;
  state: string | null;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee_pct: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  images: ListingImage[];
  amenities: Amenity[];
  host: Host;
  rating: RatingSummary;
}

export interface ListingInput {
  title: string;
  description: string;
  property_type: PropertyType;
  category: string;
  city: string;
  state: string | null;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee_pct: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids: number[];
  image_urls: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PriceHistogram {
  min_price: number;
  max_price: number;
  buckets: number[];
  bucket_size: number;
}

export interface BookedRange {
  check_in: string;
  check_out: string;
}

export interface PriceQuote {
  nights: number;
  nightly_price: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  nightly_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  listing: {
    id: number;
    title: string;
    city: string;
    country: string;
    image: string | null;
    host_name: string;
  };
  guest: UserBrief;
  has_review: boolean;
  can_review: boolean;
  can_cancel: boolean;
}

export interface Review {
  id: number;
  listing_id: number;
  booking_id: number | null;
  rating: number;
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  check_in_rating: number;
  value: number;
  comment: string;
  created_at: string;
  author: UserBrief;
}

export interface ReviewInput {
  booking_id: number;
  rating: number;
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  check_in_rating: number;
  value: number;
  comment: string;
}

export interface ListingQuery {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  category?: string;
  amenities?: string;
  min_bedrooms?: number;
  min_beds?: number;
  min_bathrooms?: number;
  page?: number;
  page_size?: number;
}
