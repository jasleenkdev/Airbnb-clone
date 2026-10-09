import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderFallback } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Airbnb Clone | Vacation rentals, cabins, beach houses & more",
  description: "Find vacation rentals, cabins, beach houses, unique homes and experiences around the world.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <Suspense>
            <MobileNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
