"use client";

import { Info } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkline } from "./Sparkline";
import { PanelCloseButton } from "./PanelToggles";
import { useUiState } from "./UiState";
import { Delta } from "./right-panel/Delta";
import { StatusInline } from "./right-panel/StatusInline";
import { STATUS_TINT, timeAgo } from "./utils";
import type {
  CountryAggregate,
  SourceHealth,
  CaseEvent,
  AnySource,
} from "@/lib/types";

interface StatusBreakdown {
  CONFIRMED: number;
  SUSPECTED: number;
  DECEASED: number;
}

interface Props {
  totalCases: number;
  fatalities: number;
  deathRate: number;
  statusBreakdown: StatusBreakdown;
  sourceHealth: SourceHealth[];
  countryRollup: CountryAggregate[];
  events: CaseEvent[];
  now: number;
}

const DAY = 24 * 60 * 60 * 1000;

const SOURCE_META: Record<
  AnySource,
  { name: string; role: string; itemNoun: string }
> = {
  ARCGIS_HONDIUS: {
    name: "ArcGIS Hondius",
    role: "Drives every headline number",
    itemNoun: "case events",
  },
  WHO_DON: {
    name: "WHO Disease Outbreak News",
    role: "Audit cross-reference",
    itemNoun: "DON records",
  },
  CDC: {
    name: "CDC Hantavirus",
    role: "US baseline reference",
    itemNoun: "records",
  },
  ECDC: { name: "ECDC", role: "EU surveillance", itemNoun: "records" },
  PAHO: { name: "PAHO", role: "Americas surveillance", itemNoun: "records" },
  GDELT: { name: "GDELT 2.0", role: "News feed", itemNoun: "articles" },
  GOOGLE_NEWS: { name: "Google News", role: "News feed", itemNoun: "articles" },
};

function buildSparkData(events: CaseEvent[], now: number): number[] {
  const buckets = new Array(14).fill(0);
  for (const ev of events) {
    const t = ev.onset ? Date.parse(ev.onset) : NaN;
    if (!Number.isFinite(t)) continue;
    const diff = now - t;
    const idx = 13 - Math.floor(diff / DAY);
    if (idx >= 0 && idx < 14) buckets[idx]++;
  }
  return buckets;
}

function countWithin(
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

function formatPct(x: number): string {
  if (!Number.isFinite(x) || x <= 0) return "0%";
  const pct = x * 100;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(0)}%`;
}

export function RightPanel({
  totalCases,
  fatalities,
  deathRate,
  statusBreakdown,
  sourceHealth,
  countryRollup,
  events,
  now,
}: Props) {
  const { panel: mode } = useUiState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams?.get("country") ?? null;

  const topCountries = countryRollup.slice(0, 5);
  const spark = buildSparkData(events, now);
  const periodTotal = spark.reduce((a, b) => a + b, 0);
  const peakValue = Math.max(0, ...spark);
  const peakIndex = spark.indexOf(peakValue);

  const newCases24h = countWithin(events, "onset", now, DAY);
  const newFatal24h = countWithin(
    events,
    "death",
    now,
    DAY,
    (e) => e.status === "DECEASED",
  );

  const onPickCountry = (iso3: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (params.get("country") === iso3) params.delete("country");
    else params.set("country", iso3);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Visibility classes:
  //   open    → always visible
  //   closed  → never visible
  //   auto    → hidden on mobile, visible md+
  const visClass =
    mode === "open" ? "flex" : mode === "closed" ? "hidden" : "hidden md:flex";

  // Layout: desktop is a floating right column; mobile is a full-width
  // bottom sheet that fills most of the viewport.
  const containerClass = `${visClass} fixed z-30 flex-col gap-3
    inset-x-2 bottom-2 top-14 max-h-[calc(100vh-3.5rem-1rem)]
    md:inset-x-auto md:right-4 md:top-16 md:bottom-14 md:max-h-none md:w-[340px]`;

  return (
    <TooltipProvider delay={200}>
      <aside className={containerClass} aria-label="Outbreak statistics">
        {/* ── Outbreak snapshot ─────────────────────────────────────── */}
        <Card className="bg-[rgba(10,18,32,0.92)] md:bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0">
          <CardHeader className="px-3.5 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Outbreak snapshot
              </CardTitle>
              <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80 font-mono">
                · MV Hondius · 2026
              </span>
            </div>
            <PanelCloseButton />
          </CardHeader>

          <CardContent className="px-3.5 py-0">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">
                  Total cases
                </span>
                <NumberTicker
                  value={totalCases}
                  className="text-[44px] font-extrabold leading-none tabular-nums text-foreground font-sans"
                />
              </div>
              <Delta value={newCases24h} window="24h" noun="new reports" />
            </div>

            <p className="mt-2 text-[10.5px] leading-snug text-muted-foreground">
              Counts <StatusInline name="CONFIRMED" /> ·{" "}
              <StatusInline name="SUSPECTED" /> ·{" "}
              <StatusInline name="DECEASED" label="FATAL" />
              <Tooltip>
                <TooltipTrigger
                  aria-label="What counts as a case"
                  className="ml-1 inline-flex align-middle text-muted-foreground/70 hover:text-foreground"
                >
                  <Info className="size-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-60 text-[11px] leading-snug">
                  Live from the ArcGIS Hondius feed. PROBABLE cases are
                  rolled in with SUSPECTED. MONITORING and RECOVERED are
                  excluded.
                </TooltipContent>
              </Tooltip>
            </p>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-2">
              <MiniKpi
                value={statusBreakdown.CONFIRMED}
                label="Confirmed"
                helper="lab-confirmed"
                tint={STATUS_TINT.CONFIRMED}
              />
              <MiniKpi
                value={statusBreakdown.SUSPECTED}
                label="Suspected"
                helper="incl. probable"
                tint={STATUS_TINT.SUSPECTED}
              />
              <MiniKpi
                value={statusBreakdown.DECEASED}
                label="Deaths"
                helper={newFatal24h > 0 ? `+${newFatal24h} · 24h` : "fatal cases"}
                tint={STATUS_TINT.DECEASED}
                accent={newFatal24h > 0}
              />
              <MiniKpi
                value={formatPct(deathRate)}
                label="Death rate"
                helper={`${fatalities} / ${totalCases}`}
                tint="var(--brand)"
                accent
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Trend ─────────────────────────────────────────────────── */}
        <Card className="bg-[rgba(10,18,32,0.92)] md:bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0">
          <CardHeader className="px-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              New cases · last 14 days
            </CardTitle>
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
              by onset
            </span>
          </CardHeader>
          <CardContent className="px-3.5 py-0">
            <Sparkline data={spark} color="var(--brand)" peakIndex={peakIndex} />
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-mono">−14d</span>
              <span>
                Peak{" "}
                <span className="font-mono text-foreground">{peakValue}</span> ·
                Total{" "}
                <span className="font-mono text-foreground">{periodTotal}</span>
              </span>
              <span className="font-mono">today</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Top countries ────────────────────────────────────────── */}
        <Card className="bg-[rgba(10,18,32,0.92)] md:bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0">
          <CardHeader className="px-3.5 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Top countries
            </CardTitle>
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              click to filter
            </span>
          </CardHeader>
          <CardContent className="px-3.5 py-0">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80 pb-1 border-b border-dashed border-border">
              <span>Country</span>
              <span className="text-right">Cases</span>
            </div>
            {topCountries.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">
                No country aggregates yet.
              </div>
            )}
            <ul className="pt-0.5">
              {topCountries.map((c) => {
                const active = selected === c.iso3;
                return (
                  <li key={c.iso3}>
                    <button
                      type="button"
                      onClick={() => onPickCountry(c.iso3)}
                      aria-pressed={active}
                      className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 rounded-[3px] px-1.5 py-1.5 text-left text-[11.5px] transition-colors hover:bg-white/4 focus-visible:bg-white/6 focus-visible:outline-none min-h-9 ${
                        active
                          ? "bg-(--brand)/15 text-brand"
                          : ""
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono tabular-nums text-foreground/90">
                        {c.totalCases.toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* ── Source health (verbose) ──────────────────────────────── */}
        <Card className="bg-[rgba(10,18,32,0.92)] md:bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0 flex-1 min-h-0 overflow-hidden">
          <CardHeader className="px-3.5 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Source health
            </CardTitle>
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              last fetch
            </span>
          </CardHeader>
          <CardContent className="px-3.5 py-0 scroll-y overflow-y-auto -mr-2 pr-2">
            <ul className="space-y-1.5">
              {sourceHealth.map((s) => (
                <SourceRow key={s.source} health={s} now={now} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </TooltipProvider>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────────────── */

function MiniKpi({
  value,
  label,
  helper,
  tint,
  accent,
}: {
  value: number | string;
  label: string;
  helper: string;
  tint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-white/2.5 ring-1 ring-inset ring-border px-2 py-2 min-w-0">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full shrink-0"
          style={{ background: tint }}
        />
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <div
        className={`mt-1 text-[20px] font-bold leading-none tabular-nums font-sans ${
          accent ? "text-brand" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[9.5px] font-mono text-muted-foreground/80 truncate">
        {helper}
      </div>
    </div>
  );
}

function SourceRow({
  health,
  now,
}: {
  health: SourceHealth;
  now: number;
}) {
  const meta = SOURCE_META[health.source] ?? {
    name: health.source,
    role: "",
    itemNoun: "items",
  };
  const empty = health.ok && health.items === 0;
  const dotColor = !health.ok
    ? "var(--hot)"
    : empty
      ? "var(--warn)"
      : "var(--ok)";
  const stateLabel = !health.ok
    ? "Failing"
    : empty
      ? "Empty fetch"
      : "Healthy";
  const stateColor = !health.ok
    ? "text-hot"
    : empty
      ? "text-warn"
      : "text-ok";

  return (
    <li className="rounded-md ring-1 ring-inset ring-border bg-white/2 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full shrink-0"
            style={{ background: dotColor }}
          />
          <span className="text-[13px] font-semibold text-foreground truncate">
            {meta.name}
          </span>
        </div>
        <span
          className={`text-[10px] uppercase tracking-[0.14em] font-mono font-semibold shrink-0 ${stateColor}`}
        >
          {stateLabel}
        </span>
      </div>
      <div className="mt-1 text-[11.5px] text-muted-foreground truncate">
        {meta.role}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] font-mono">
        <span className="text-foreground/90">
          <span className="text-foreground font-semibold tabular-nums">
            {health.items}
          </span>{" "}
          <span className="text-muted-foreground">{meta.itemNoun}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {timeAgo(health.fetchedAt, now)} ago
        </span>
      </div>
      {health.error && (
        <div className="mt-1 text-[11px] font-mono text-(--hot)/90 truncate">
          ↳ {health.error}
        </div>
      )}
    </li>
  );
}
