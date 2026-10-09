"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";

/** Swipeable (scroll-snap) image carousel with hover arrows and dots, like Airbnb's listing cards. */
export function ImageCarousel({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const go = (e: React.MouseEvent, dir: 1 | -1) => {
    e.preventDefault();
    e.stopPropagation();
    const el = trackRef.current;
    if (!el) return;
    const next = Math.min(images.length - 1, Math.max(0, index + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Show at most 5 dots, sliding window around the active one.
  const dotStart = Math.min(Math.max(0, index - 2), Math.max(0, images.length - 5));
  const dots = images.slice(dotStart, dotStart + 5).map((_, i) => dotStart + i);

  return (
    <div className={cn("group/carousel relative overflow-hidden", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${alt} – photo ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => go(e, -1)}
              className="absolute top-1/2 left-3 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover/carousel:opacity-100 hover:scale-105 hover:bg-white md:flex"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => go(e, 1)}
              className="absolute top-1/2 right-3 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition group-hover/carousel:opacity-100 hover:scale-105 hover:bg-white md:flex"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {dots.map((i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full bg-white transition-all",
                  i === index ? "h-1.5 w-1.5 opacity-100" : "h-1.5 w-1.5 opacity-60",
                  (i === dotStart && dotStart > 0) || (i === dotStart + 4 && dotStart + 5 < images.length)
                    ? "scale-75"
                    : "",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
