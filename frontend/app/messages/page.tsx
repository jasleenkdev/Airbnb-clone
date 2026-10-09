import type { Metadata } from "next";

import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Messages · Airbnb Clone" };

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      description="Chat with hosts and guests before and during your trip. Real-time messaging is on the roadmap."
    />
  );
}
