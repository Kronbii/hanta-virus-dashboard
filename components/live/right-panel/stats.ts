import type { CaseEvent } from "@/lib/types";

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bucket case events into the trailing 14 days by onset date. Returns
 * a length-14 array where index 13 is "today" and index 0 is "14 days ago".
 */
export function buildSparkData(events: CaseEvent[], now: number): number[] {
  const buckets = new Array(14).fill(0);
  for (const ev of events) {
    const t = ev.onset ? Date.parse(ev.onset) : NaN;
    if (!Number.isFinite(t)) continue;
    const diff = now - t;
    const idx = 13 - Math.floor(diff / DAY_MS);
    if (idx >= 0 && idx < 14) buckets[idx]++;
  }
  return buckets;
}

/**
 * Count events whose `field` date falls within `windowMs` of `now`.
 * Optional predicate filters which events count (e.g. only DECEASED).
 */
export function countWithin(
  events: CaseEvent[],
  field: "onset" | "death",
  now: number,
  windowMs: number,
  predicate?: (e: CaseEvent) => boolean,
): number {
  let n = 0;
  for (const ev of events) {
    if (predicate && !predicate(ev)) continue;
    const raw = ev[field];
    if (!raw) continue;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    if (now - t <= windowMs && now - t >= 0) n++;
  }
  return n;
}

/**
 * Format a [0, 1] ratio as a percentage. < 10% gets one decimal,
 * larger values are rounded. Non-finite/zero returns "0%".
 */
export function formatPct(x: number): string {
  if (!Number.isFinite(x) || x <= 0) return "0%";
  const pct = x * 100;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(0)}%`;
}
