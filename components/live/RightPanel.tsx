"use client";

import { TrendingUp, Minus } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Sparkline } from "./Sparkline";
import type { CountryAggregate, SourceHealth, CaseEvent } from "@/lib/types";

interface Props {
  totalCases: number;
  countries: number;
  fatalities: number;
  liveEvents: number;
  sourceHealth: SourceHealth[];
  countryRollup: CountryAggregate[];
  events: CaseEvent[];
  now: number;
}

const SOURCE_LABEL: Record<string, string> = {
  WHO_DON: "WHO DON",
  CDC: "CDC",
  ECDC: "ECDC",
  PAHO: "PAHO",
  GDELT: "GDELT",
  GOOGLE_NEWS: "GNews",
  ARCGIS_HONDIUS: "ArcGIS",
};

const DAY = 24 * 60 * 60 * 1000;

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

function formatDelta(n: number, suffix: string): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n} / ${suffix}`;
}

export function RightPanel({
  totalCases,
  countries,
  fatalities,
  liveEvents,
  sourceHealth,
  countryRollup,
  events,
  now,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams?.get("country") ?? null;

  const topCountries = countryRollup.slice(0, 5);
  const spark = buildSparkData(events, now);

  const newCases24h = countWithin(events, "onset", now, DAY);
  const newFatal24h = countWithin(
    events,
    "death",
    now,
    DAY,
    (e) => e.status === "DECEASED",
  );
  const countriesWithRecent = (() => {
    const seen = new Set<string>();
    for (const ev of events) {
      const t = ev.onset ? Date.parse(ev.onset) : NaN;
      if (!Number.isFinite(t)) continue;
      if (now - t > 7 * DAY) continue;
      if (ev.countryIso3) seen.add(ev.countryIso3);
    }
    return seen.size;
  })();

  const onPickCountry = (iso3: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (params.get("country") === iso3) params.delete("country");
    else params.set("country", iso3);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <aside className="absolute right-4 top-16 bottom-14 z-10 flex w-[320px] flex-col gap-3">
      <Card className="bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0">
        <CardHeader className="px-3.5 pb-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Snapshot · 24h
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3.5 py-0">
          <Kpi
            label="Active cases"
            value={totalCases}
            delta={formatDelta(newCases24h, "24h")}
            trend={newCases24h > 0 ? "up" : "flat"}
          />
          <Kpi
            label="Countries"
            value={countries}
            delta={formatDelta(countriesWithRecent, "7d")}
            trend={countriesWithRecent > 0 ? "up" : "flat"}
          />
          <Kpi
            label="Fatalities"
            value={fatalities}
            delta={formatDelta(newFatal24h, "24h")}
            trend={newFatal24h > 0 ? "up" : "flat"}
          />
          <Kpi label="Live event pins" value={liveEvents} delta="ArcGIS" trend="flat" />
        </CardContent>
      </Card>

      <Card className="bg-[rgba(10,18,32,0.78)] backdrop-blur-md border-border shadow-[0_20px_40px_rgba(0,0,0,0.5)] py-3 gap-0 flex-1 min-h-0 overflow-hidden">
        <CardHeader className="px-3.5 pb-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Trend · new cases · 14d
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3.5 py-0">
          <Sparkline data={spark} />
        </CardContent>
        <Separator className="my-3" />
        <CardHeader className="px-3.5 pb-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Top countries
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3.5 py-0 space-y-1">
          {topCountries.length === 0 && (
            <div className="text-xs text-muted-foreground">No country aggregates yet.</div>
          )}
          {topCountries.map((c) => {
            const active = selected === c.iso3;
            return (
              <button
                key={c.iso3}
                type="button"
                onClick={() => onPickCountry(c.iso3)}
                aria-pressed={active}
                className={`flex w-full items-center justify-between gap-3 rounded-sm px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none ${
                  active ? "bg-[#f6a623]/15 text-[#f6a623]" : ""
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {c.totalCases.toLocaleString()}
                </span>
              </button>
            );
          })}
        </CardContent>
        <Separator className="my-3" />
        <CardHeader className="px-3.5 pb-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Source health
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3.5 py-0 flex flex-wrap gap-1.5">
          {sourceHealth.map((s) => {
            const label = SOURCE_LABEL[s.source] ?? s.source;
            const title = s.error ? `${label}: ${s.error}` : `${label}: ${s.items} items`;
            return (
              <Badge
                key={s.source}
                variant="outline"
                title={title}
                className="rounded-full border-border bg-white/5 px-2 py-0.5 text-[10px] tracking-[0.04em] gap-1.5"
              >
                <span
                  className={`size-1.5 rounded-full ${s.ok ? "bg-[#4ade80]" : "bg-[#e23b3b]"}`}
                  aria-hidden
                />
                {label}
                <span className="text-muted-foreground tabular-nums">
                  {s.items}
                </span>
              </Badge>
            );
          })}
        </CardContent>
      </Card>
    </aside>
  );
}

function Kpi({
  label,
  value,
  delta,
  trend = "up",
}: {
  label: string;
  value: number;
  delta: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <div className="flex items-baseline justify-between border-t border-dashed border-border py-1.5 first:border-t-0 first:pt-0">
      <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <NumberTicker
          value={value}
          className="text-[22px] font-bold leading-none tabular-nums text-foreground"
        />
        <span
          className={`flex items-center gap-1 text-[10px] tabular-nums ${
            trend === "flat" ? "text-muted-foreground" : "text-[#4ade80]"
          }`}
        >
          {trend === "flat" ? <Minus className="size-2.5" /> : <TrendingUp className="size-2.5" />}
          {delta}
        </span>
      </span>
    </div>
  );
}
