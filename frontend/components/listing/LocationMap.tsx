"use client";

import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";

const homeIcon = L.divIcon({
  className: "price-pin",
  html: `<div style="background:#FF385C;color:#fff;padding:12px;border-radius:9999px;display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`,
  iconSize: [0, 0],
});

/** Single-listing location map. Load with next/dynamic + ssr:false. */
export default function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={[lat, lng]} radius={600} pathOptions={{ color: "#FF385C", fillColor: "#FF385C", fillOpacity: 0.12, weight: 0 }} />
      <Marker position={[lat, lng]} icon={homeIcon} />
    </MapContainer>
  );
}
