import type { Metadata } from "next";

import { AccountView } from "@/components/layout/AccountView";

export const metadata: Metadata = { title: "Account · Airbnb Clone" };

export default function AccountPage() {
  return <AccountView />;
}
