import type { Metadata } from "next";

import { NewListing } from "@/components/host/ListingEditor";

export const metadata: Metadata = { title: "Create a listing · Airbnb Clone" };

export default function NewListingPage() {
  return <NewListing />;
}
