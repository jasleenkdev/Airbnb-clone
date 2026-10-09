import type { Metadata } from "next";

import { HostDashboard } from "@/components/host/HostDashboard";

export const metadata: Metadata = { title: "Host dashboard · Airbnb Clone" };

export default function HostPage() {
  return <HostDashboard />;
}
