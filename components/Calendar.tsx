"use client";

import { useState } from "react";
import { addDays, fromISODate, toISODate, todayMidnight } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CalendarProps {
  /** Inclusive ISO days that are already booked and cannot be selected. */
  disabled: Set<string>;
  /** Currently selected first stay-day (inclusive). */
  start: string | null;
  /** Currently selected last stay-day (inclusive). */
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  /** Called when the chosen range would cross an already-booked day. */
  onInvalid?: () => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function Calendar({ disabled, start, end, onChange, onInvalid }: CalendarProps) {
  const today = todayMidnight();
  const initial = start ? fromISODate(start) : today;
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Can't navigate to a month entirely before the current one.
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  function rangeHasBookedDay(from: string, to: string): boolean {
    let cur = fromISODate(from);
    // `to` is the calendar end-pick = checkout day (11AM). The next guest
    // checks in at 12PM the same day, so a booked night starting on `to`
    // doesn't conflict with this stay. Stop one day before `to`.
    const last = addDays(fromISODate(to), -1);
    while (cur <= last) {
      if (disabled.has(toISODate(cur))) return true;
      cur = addDays(cur, 1);
    }
    return false;
  }

  function handleClick(iso: string, isDisabled: boolean) {
    if (isDisabled) return;

    // Begin a fresh selection.
    if (!start || (start && end)) {
      onChange(iso, null);
      return;
    }

    // Tapping the start again clears it.
    if (iso === start) {
      onChange(null, null);
      return;
    }

    // Picking an earlier day restarts the selection there.
    if (fromISODate(iso) < fromISODate(start)) {
      onChange(iso, null);
      return;
    }

    // Otherwise this is the end day — reject if the span crosses a booked day.
    if (rangeHasBookedDay(start, iso)) {
      onInvalid?.();
      return;
    }
    onChange(start, iso);
  }

  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toISODate(new Date(year, month, d)), day: d });
  }

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          disabled={atCurrentMonth}
          className="flex h-9 w-9 items-center justify-center rounded-full text-palm-800 transition hover:bg-palm-800/5 disabled:opacity-30"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-display text-lg text-palm-900">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-palm-800 transition hover:bg-palm-800/5"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink/40">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`b${idx}`} />;
          const date = fromISODate(cell.iso);
          const isPast = date < today;
          const isBooked = disabled.has(cell.iso);
          const isDisabled = isPast || isBooked;
          const isStart = cell.iso === start;
          const isEnd = cell.iso === end;
          const inRange =
            start && end && date > fromISODate(start) && date < fromISODate(end);
          const isEdge = isStart || isEnd;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => handleClick(cell.iso, isDisabled)}
              disabled={isDisabled}
              aria-label={cell.iso}
              className={cn(
                "relative flex h-10 items-center justify-center rounded-lg text-sm transition",
                isEdge && "bg-palm-800 font-semibold text-jasmine-50",
                inRange && "bg-palm-100 text-palm-900",
                !isDisabled && !isEdge && !inRange && "text-ink hover:bg-marigold-400/20",
                isBooked && "cursor-not-allowed text-ink/30 line-through",
                isPast && !isBooked && "cursor-not-allowed text-ink/20"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-palm-800" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-palm-100" /> In your stay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-jasmine-200 line-through" /> Already booked
        </span>
      </div>
    </div>
  );
}
