import { Suspense } from "react";

import { ConfirmationView } from "@/components/booking/ConfirmationView";

export default function BookingConfirmedPage() {
  return (
    <Suspense>
      <ConfirmationView />
    </Suspense>
  );
}
