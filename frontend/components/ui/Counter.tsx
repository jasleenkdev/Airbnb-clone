"use client";

import { Minus, Plus } from "lucide-react";

interface CounterProps {
  label: string;
  description?: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Counter({ label, description, value, min = 0, max = 16, onChange }: CounterProps) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-200";
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="font-semibold text-gray-900">{label}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={btn}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <span className="w-6 text-center tabular-nums" aria-live="polite">
          {value}
          {max >= 16 && value >= max ? "+" : ""}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
