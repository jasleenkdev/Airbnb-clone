"use client";

import dynamic from "next/dynamic";

export const LocationPicker = dynamic(() => import("@/components/host/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
});
