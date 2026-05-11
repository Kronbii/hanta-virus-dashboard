import type { CaseEvent, CaseEventStatus } from "@/lib/types";

// PROBABLE is presented as SUSPECTED across the UI — keep the underlying
// status distinct in the data layer but render them identically.
export const STATUS_TINT: Record<CaseEventStatus, string> = {
  DECEASED: "#e23b3b",
  CONFIRMED: "#f6a623",
  PROBABLE: "#cbd5e1",
  SUSPECTED: "#cbd5e1",
  MONITORING: "#9ca3af",
  RECOVERED: "#4ade80",
  UNKNOWN: "#6b7280",
};

export const STATUS_INK: Record<CaseEventStatus, string> = {
  DECEASED: "#ffffff",
  CONFIRMED: "#1a0e00",
  PROBABLE: "#0b1220",
  SUSPECTED: "#0b1220",
  MONITORING: "#0b1220",
  RECOVERED: "#031a07",
  UNKNOWN: "#0b1220",
};

export const STATUS_LABEL: Record<CaseEventStatus, string> = {
  DECEASED: "FATAL",
  CONFIRMED: "CONFIRMED",
  PROBABLE: "SUSPECTED",
  SUSPECTED: "SUSPECTED",
  MONITORING: "MONITORING",
  RECOVERED: "RECOVERED",
  UNKNOWN: "UNKNOWN",
};

export function timeAgo(iso: string | undefined, now: number): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 31) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

export function eventHeadline(ev: CaseEvent): string {
  const loc = ev.location ?? ev.exposureGroup ?? "unspecified location";
  const noun =
    ev.status === "DECEASED" ? "Fatal case"
    : ev.status === "CONFIRMED" ? "Confirmed case"
    : ev.status === "PROBABLE" || ev.status === "SUSPECTED" ? "Suspected case"
    : ev.status === "RECOVERED" ? "Recovered case"
    : ev.status === "MONITORING" ? "Case under monitoring"
    : "Case reported";
  if (ev.caseLabel) return `${noun} · ${ev.caseLabel} · ${loc}`;
  return `${noun} · ${loc}`;
}

export function isoDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}
