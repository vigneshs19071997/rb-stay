/** Join class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Format a Date as a local YYYY-MM-DD string (timezone-safe for DATE columns). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today at local midnight. */
export function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Whole-day difference between two ISO dates (b - a). */
export function diffDays(aISO: string, bISO: string): number {
  const a = fromISODate(aISO).getTime();
  const b = fromISODate(bISO).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Human-friendly date, e.g. "12 Jul 2026". */
export function prettyDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Normalize a DATE value from the DB driver (string or Date) to YYYY-MM-DD. */
export function normalizeISODate(v: string | Date): string {
  if (typeof v === "string") return v.slice(0, 10);
  // Use local-time methods: the neon driver creates Date objects at local
  // midnight, so getUTC* methods return the previous day in UTC+ timezones.
  return toISODate(v);
}

/** All occupied nights for a [checkIn, checkOut) range as ISO strings. */
export function nightsInRange(checkInISO: string, checkOutISO: string): string[] {
  const out: string[] = [];
  let cur = fromISODate(checkInISO);
  const end = fromISODate(checkOutISO);
  while (cur < end) {
    out.push(toISODate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}
