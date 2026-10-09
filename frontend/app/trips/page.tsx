import type { Metadata } from "next";

import { TripsView } from "@/components/booking/TripsView";

export const metadata: Metadata = { title: "Trips · Airbnb Clone" };

export default function TripsPage() {
  return <TripsView />;
}
