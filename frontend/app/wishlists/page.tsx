import type { Metadata } from "next";

import { WishlistsView } from "@/components/listing/WishlistsView";

export const metadata: Metadata = { title: "Wishlists · Airbnb Clone" };

export default function WishlistsPage() {
  return <WishlistsView />;
}
