"use client";

import dynamic from "next/dynamic";

const MapLoading = () => <div className="h-full w-full animate-pulse bg-gray-100" />;

// Leaflet touches `window` on import, so maps are client-only.
export const ListingsMap = dynamic(() => import("@/components/listing/ListingsMap"), { ssr: false, loading: MapLoading });
export const LocationMap = dynamic(() => import("@/components/listing/LocationMap"), { ssr: false, loading: MapLoading });
