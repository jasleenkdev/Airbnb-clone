"use client";

import { cn } from "@/lib/cn";
import type { PriceHistogram } from "@/types";

interface PriceRangeProps {
  histogram: PriceHistogram;
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

/** Two-thumb price slider with a histogram, like Airbnb's filters modal. */
export function PriceRange({ histogram, min, max, onChange }: PriceRangeProps) {
  const lo = histogram.min_price;
  const hi = Math.max(histogram.max_price, lo + 1);
  const step = 5;
  const peak = Math.max(1, ...histogram.buckets);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  const thumb =
    "pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md";

  return (
    <div>
      <div className="relative px-4">
        <div className="flex h-20 items-end gap-[2px]">
          {histogram.buckets.map((count, i) => {
            const bucketLo = lo + i * histogram.bucket_size;
            const inRange = bucketLo + histogram.bucket_size > min && bucketLo <= max;
            return (
              <div
                key={i}
                className={cn("flex-1 rounded-t-sm", inRange ? "bg-brand" : "bg-gray-300")}
                style={{ height: `${count ? Math.max(6, (count / peak) * 100) : 0}%` }}
              />
            );
          })}
        </div>
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-300" />
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-gray-900"
            style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
          />
          <input
            type="range"
            aria-label="Minimum price"
            min={lo}
            max={hi}
            step={step}
            value={min}
            onChange={(e) => onChange(Math.min(Number(e.target.value), max - step), max)}
            className={thumb}
          />
          <input
            type="range"
            aria-label="Maximum price"
            min={lo}
            max={hi}
            step={step}
            value={max}
            onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + step))}
            className={thumb}
          />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <PriceBox label="Minimum" value={min} onChange={(v) => onChange(Math.min(v, max), max)} />
        <span className="text-gray-400">–</span>
        <PriceBox label="Maximum" value={max} onChange={(v) => onChange(min, Math.max(v, min))} plus={max >= hi} />
      </div>
    </div>
  );
}

function PriceBox({ label, value, onChange, plus }: { label: string; value: number; onChange: (v: number) => void; plus?: boolean }) {
  return (
    <label className="flex-1 rounded-full border border-gray-300 px-5 py-2 text-center focus-within:border-gray-900">
      <span className="block text-xs text-gray-500">{label}</span>
      <span className="flex items-center justify-center">
        $
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-16 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {plus && "+"}
      </span>
    </label>
  );
}
