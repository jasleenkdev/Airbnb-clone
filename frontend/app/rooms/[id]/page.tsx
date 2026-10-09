import { Suspense } from "react";

import { DetailSkeleton, ListingDetailView } from "@/components/listing/ListingDetailView";

export default function ListingPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ListingDetailView />
    </Suspense>
  );
}
