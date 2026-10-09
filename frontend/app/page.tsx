import { Suspense } from "react";

import { ExploreView } from "@/components/listing/ExploreView";
import { GRID_CLASSES, ListingCardSkeleton } from "@/components/listing/ListingCard";

function ExploreFallback() {
  return (
    <div className="mx-auto max-w-[1760px] px-6 pt-28 md:px-10 xl:px-20">
      <div className={GRID_CLASSES}>
        {Array.from({ length: 10 }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreView />
    </Suspense>
  );
}
