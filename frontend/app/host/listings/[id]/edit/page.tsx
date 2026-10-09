import { Suspense } from "react";

import { EditListing } from "@/components/host/ListingEditor";

export default function EditListingPage() {
  return (
    <Suspense>
      <EditListing />
    </Suspense>
  );
}
