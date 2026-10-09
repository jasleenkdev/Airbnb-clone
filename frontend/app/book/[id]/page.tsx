import { Suspense } from "react";

import { CheckoutSkeleton, CheckoutView } from "@/components/booking/CheckoutView";

export default function BookPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutView />
    </Suspense>
  );
}
