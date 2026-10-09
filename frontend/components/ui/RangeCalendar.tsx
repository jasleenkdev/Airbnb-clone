"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { toISODate } from "@/lib/format";
import type { BookedRange } from "@/types";

interface RangeCalendarProps {
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  booked?: BookedRange[];
  months?: 1 | 2;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Airbnb-style date range picker.
 * Booked ranges are half-open [check_in, check_out): the check-out day of one stay is a valid check-in day.
 */
export function RangeCalendar({ checkIn, checkOut, onChange, booked = [], months = 2, className }: RangeCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const start = checkIn ? parseISO(checkIn) : null;
  const end = checkOut ? parseISO(checkOut) : null;
  const [cursor, setCursor] = useState(() => startOfMonth(start ?? today));
  const [hover, setHover] = useState<Date | null>(null);

  const ranges = useMemo(() => booked.map((b) => [parseISO(b.check_in), parseISO(b.check_out)] as const), [booked]);

  /** Night `d` is occupied by an existing booking. */
  const isBookedNight = (d: Date) => ranges.some(([a, b]) => !isBefore(d, a) && isBefore(d, b));

  /** While choosing a check-out, you can't go past the next booking's check-in. */
  const maxCheckout = useMemo(() => {
    if (!start || end) return null;
    const upcoming = ranges.filter(([a]) => !isBefore(a, start) && !isSameDay(a, start)).map(([a]) => a);
    upcoming.sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] ?? null;
  }, [ranges, start, end]);

  const choosingCheckout = !!start && !end;

  const isDisabled = (d: Date) => {
    if (isBefore(d, today)) return true;
    if (choosingCheckout && start && isAfter(d, start)) {
      return maxCheckout ? isAfter(d, maxCheckout) : false;
    }
    return isBookedNight(d);
  };

  const handleClick = (d: Date) => {
    if (isDisabled(d)) return;
    if (!start || end || !isAfter(d, start)) {
      if (isBookedNight(d)) return;
      onChange(toISODate(d), null);
    } else {
      onChange(toISODate(start), toISODate(d));
    }
  };

  const rangeEnd = end ?? (choosingCheckout && hover && start && isAfter(hover, start) && !isDisabled(hover) ? hover : null);

  const monthList = Array.from({ length: months }, (_, i) => addMonths(cursor, i));
  const canGoBack = isAfter(cursor, startOfMonth(today));

  return (
    <div className={cn("select-none", className)}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="absolute top-0 left-0 rounded-full p-2 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="Next month"
          className="absolute top-0 right-0 rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className={cn("grid gap-8", months === 2 && "md:grid-cols-2")}>
          {monthList.map((month, mi) => {
            const days = eachDayOfInterval({
              start: startOfWeek(startOfMonth(month)),
              end: endOfWeek(endOfMonth(month)),
            });
            return (
              <div key={month.toISOString()} className={cn(mi === 1 && "hidden md:block")}>
                <div className="mb-4 pt-1.5 text-center text-base font-semibold">{format(month, "MMMM yyyy")}</div>
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-2">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
                  {days.map((d) => {
                    if (!isSameMonth(d, month)) return <div key={d.toISOString()} className="h-11" />;
                    const disabled = isDisabled(d);
                    const isStart = !!start && isSameDay(d, start);
                    const isEnd = !!rangeEnd && isSameDay(d, rangeEnd);
                    const inRange = !!start && !!rangeEnd && isAfter(d, start) && isBefore(d, rangeEnd);
                    const bookedNight = isBookedNight(d) && !isBefore(d, today);
                    const hasRange = !!start && !!rangeEnd;
                    return (
                      <div
                        key={d.toISOString()}
                        className={cn(
                          "relative h-11",
                          inRange && "bg-gray-100",
                          isStart && hasRange && "bg-gradient-to-r from-transparent from-50% to-gray-100 to-50%",
                          isEnd && hasRange && "bg-gradient-to-l from-transparent from-50% to-gray-100 to-50%",
                        )}
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleClick(d)}
                          onMouseEnter={() => setHover(d)}
                          aria-label={`${format(d, "EEEE, MMMM d, yyyy")}${bookedNight ? " (unavailable)" : ""}`}
                          aria-pressed={isStart || isEnd}
                          className={cn(
                            "mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition",
                            disabled
                              ? "cursor-not-allowed text-gray-300"
                              : "text-gray-900 hover:border hover:border-gray-900",
                            bookedNight && disabled && "line-through",
                            (isStart || isEnd) && "bg-gray-900 text-white hover:border-0",
                          )}
                        >
                          {format(d, "d")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function addNights(iso: string, n: number) {
  return toISODate(addDays(parseISO(iso), n));
}
