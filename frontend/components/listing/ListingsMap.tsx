"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { money, rating } from "@/lib/format";
import type { ListingCard } from "@/types";

function priceIcon(price: number) {
  return L.divIcon({ className: "price-pin", html: `<div>${money(price)}</div>`, iconSize: [0, 0] });
}

function FitBounds({ listings }: { listings: ListingCard[] }) {
  const map = useMap();
  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
  }, [listings, map]);
  return null;
}

/** Map of listings with Airbnb-style price pins. Must be loaded with next/dynamic + ssr:false. */
export default function ListingsMap({ listings }: { listings: ListingCard[] }) {
  const icons = useMemo(() => new Map(listings.map((l) => [l.id, priceIcon(l.price_per_night)])), [listings]);
  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full" worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={listings} />
      {listings.map((l) => (
        <Marker key={l.id} position={[l.latitude, l.longitude]} icon={icons.get(l.id)!}>
          <Popup closeButton={false}>
            <a href={`/rooms/${l.id}`} className="block text-gray-900 no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.images[0]} alt={l.title} className="h-40 w-full object-cover" />
              <div className="p-3 text-sm">
                <div className="flex justify-between gap-2 font-semibold">
                  <span className="truncate">
                    {l.city}, {l.country}
                  </span>
                  <span>★ {rating(l.avg_rating)}</span>
                </div>
                <div className="truncate text-gray-500">{l.title}</div>
                <div className="mt-1">
                  <b>{money(l.price_per_night)}</b> night
                </div>
              </div>
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
