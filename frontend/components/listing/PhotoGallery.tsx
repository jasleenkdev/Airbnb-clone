"use client";

import { ChevronLeft, Grid3x3 } from "lucide-react";
import { useState } from "react";

import { ImageCarousel } from "@/components/listing/ImageCarousel";
import { cn } from "@/lib/cn";
import type { ListingImage } from "@/types";

export function PhotoGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const urls = images.map((i) => i.url);
  const grid = urls.slice(0, 5);

  return (
    <>
      {/* Mobile: swipeable carousel */}
      <div className="-mx-6 md:hidden">
        <ImageCarousel images={urls} alt={title} className="aspect-[4/3]" />
      </div>

      {/* Desktop: 1 large + 4 small grid */}
      <div className="relative hidden md:block">
        <div className="grid h-[min(560px,45vw)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl">
          {grid.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setOpen(true)}
              className={cn("group relative min-h-0 overflow-hidden bg-gray-100", tileClass(i, grid.length))}
              aria-label={`Open photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} – photo ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-6 bottom-6 flex items-center gap-2 rounded-lg border border-gray-900 bg-white px-4 py-1.5 text-sm font-semibold shadow-sm hover:bg-gray-50"
        >
          <Grid3x3 className="h-4 w-4" /> Show all photos
        </button>
      </div>

      {open && <AllPhotos urls={urls} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Grid placement for the 1-large + up-to-4-small layout, degrading gracefully with fewer photos. */
function tileClass(i: number, count: number) {
  if (i === 0) return count === 1 ? "col-span-4 row-span-2" : "col-span-2 row-span-2";
  if (count === 2) return "col-span-2 row-span-2";
  if (count === 3) return "row-span-2";
  if (count === 4 && i === 1) return "row-span-2";
  return "";
}

function AllPhotos({ urls, title, onClose }: { urls: string[]; title: string; onClose: () => void }) {
  return (
    <div className="animate-slide-up fixed inset-0 z-[1000] overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label="All photos">
      <div className="sticky top-0 z-10 flex h-16 items-center bg-white px-6">
        <button type="button" onClick={onClose} aria-label="Close photos" className="rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto max-w-3xl space-y-2 px-6 pb-16">
        {urls.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${title} – photo ${i + 1}`}
            loading="lazy"
            className={cn("w-full object-cover", i % 3 === 0 ? "aspect-[3/2]" : "aspect-square")}
          />
        ))}
      </div>
    </div>
  );
}
