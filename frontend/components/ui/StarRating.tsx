import { Star } from "lucide-react";

import { rating } from "@/lib/format";

export function StarRating({ value, count, className }: { value: number | null; count?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <Star className="h-3.5 w-3.5 fill-current" />
      <span>{rating(value)}</span>
      {count != null && count > 0 && <span className="text-gray-500">({count})</span>}
    </span>
  );
}
