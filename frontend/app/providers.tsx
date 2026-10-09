"use client";

import { Toaster } from "sonner";

import { UserProvider } from "@/hooks/useUser";
import { WishlistProvider } from "@/hooks/useWishlist";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <WishlistProvider>
        {children}
        <Toaster position="bottom-left" richColors closeButton toastOptions={{ style: { borderRadius: 12 } }} />
      </WishlistProvider>
    </UserProvider>
  );
}
