import { connection } from "next/server";
import { aggregateCases } from "@/lib/aggregator/cases";
import { aggregateCaseEvents } from "@/lib/aggregator/case-events";
import { aggregateNews } from "@/lib/aggregator/news";
import { iso3ToName } from "@/lib/aggregator/country-codes";
import type { CaseEvent, CountryAggregate } from "@/lib/types";
import { TopBar } from "./TopBar";
import { EventFeed } from "./EventFeed";
import { RightPanel } from "./RightPanel";
import { NewsTicker } from "./NewsTicker";
import { LiveMap } from "./LiveMap";
import { FeedOpenButton, PanelOpenButton } from "./PanelToggles";
import { MobileStatsHud } from "./MobileStatsHud";

export interface DashboardFilters {
  country?: string;
  q?: string;
  view?: string;
  feed?: string; // "show" | "hide" — overrides viewport default
  panel?: string; // "show" | "hide" — overrides viewport default
}

// Statuses we treat as "an actual case" for the headline. PROBABLE is
// rolled into SUSPECTED at presentation time; MONITORING / RECOVERED /
// UNKNOWN are excluded as they aren't part of an active outbreak count.
const ACTIVE_STATUSES = new Set([
  "CONFIRMED",
  "PROBABLE",
  "SUSPECTED",
  "DECEASED",
]);

const CASES_STATUS_SET = new Set(["CONFIRMED", "PROBABLE", "SUSPECTED"]);

function applyEventFilters(events: CaseEvent[], filters: DashboardFilters): CaseEvent[] {
  let out = events;
  if (filters.view === "cases") {
    out = out.filter((e) => CASES_STATUS_SET.has(e.status));
  }
  if (filters.country) {
    out = out.filter((e) => e.countryIso3 === filters.country);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter(
      (e) =>
        e.location?.toLowerCase().includes(q) ||
        e.exposureGroup?.toLowerCase().includes(q) ||
        e.caseLabel?.toLowerCase().includes(q),
    );
  }
  return out;
}

/**
 * Roll an event list up to per-country case counts. Used for the Top
 * countries panel. Counts active-status events only — MONITORING /
 * RECOVERED / UNKNOWN don't contribute.
 */
function rollupEventsByCountry(events: CaseEvent[]): CountryAggregate[] {
  const buckets = new Map<string, { n: number; last: string }>();
  for (const ev of events) {
    if (!ev.countryIso3) continue;
    if (!ACTIVE_STATUSES.has(ev.status)) continue;
    const bucket = buckets.get(ev.countryIso3) ?? { n: 0, last: "" };
    bucket.n += 1;
    const stamp = ev.death ?? ev.onset ?? "";
    if (stamp && stamp > bucket.last) bucket.last = stamp;
    buckets.set(ev.countryIso3, bucket);
  }
  return Array.from(buckets.entries())
    .map(([iso3, b]) => ({
      iso3,
      name: iso3ToName(iso3),
      totalCases: b.n,
      lastUpdated: b.last || new Date().toISOString(),
      sources: ["ARCGIS_HONDIUS" as const] as never as CountryAggregate["sources"],
    }))
    .sort((a, b) => b.totalCases - a.totalCases);
}

export async function LiveDashboard({
  searchParams,
}: {
  searchParams: Promise<DashboardFilters>;
}) {
  // Opt into dynamic (request-time) rendering. Required so Date.now() can be
  // used for relative-time labels under Next.js cacheComponents mode.
  await connection();

  const filters = await searchParams;

  const [casesResult, eventsResult, newsResult] = await Promise.all([
    aggregateCases(),
    aggregateCaseEvents(),
    aggregateNews(filters.country),
  ]);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const filteredEvents = applyEventFilters(eventsResult.events, filters);

  // The dashboard headlines reflect the current outbreak (ArcGIS Hondius),
  // not 30 years of WHO/CDC history. casesResult.* still surfaces in the
  // Source health badges so flaky upstreams are visible.
  //
  // PROBABLE and SUSPECTED are merged: the data layer keeps the distinction
  // but every count surfaced to the UI lumps them under "SUSPECTED".
  const eventCountryRollup = rollupEventsByCountry(eventsResult.events);
  const statusBreakdown = { CONFIRMED: 0, SUSPECTED: 0, DECEASED: 0 };
  for (const e of eventsResult.events) {
    if (e.status === "CONFIRMED") statusBreakdown.CONFIRMED += 1;
    else if (e.status === "SUSPECTED" || e.status === "PROBABLE")
      statusBreakdown.SUSPECTED += 1;
    else if (e.status === "DECEASED") statusBreakdown.DECEASED += 1;
  }
  const totalCases =
    statusBreakdown.CONFIRMED +
    statusBreakdown.SUSPECTED +
    statusBreakdown.DECEASED;
  const fatalities = statusBreakdown.DECEASED;
  const deathRate = totalCases > 0 ? fatalities / totalCases : 0;

  const tracked = filteredEvents.length;

  const allHealth = [
    ...casesResult.health,
    ...eventsResult.health,
    ...newsResult.health,
  ];

  // Visibility modes — explicit URL override, otherwise viewport-driven
  // (desktop shows by default, mobile hides by default). The left feed
  // defaults to hidden everywhere; users opt in via the Cases pill.
  const feedMode: "show" | "hide" | "auto" =
    filters.feed === "show" ? "show" : filters.feed === "auto" ? "auto" : "hide";
  const panelMode: "show" | "hide" | "auto" =
    filters.panel === "show" ? "show" : filters.panel === "hide" ? "hide" : "auto";

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <LiveMap countries={eventCountryRollup} events={filteredEvents} />

      <TopBar
        trackedCount={tracked}
        view={filters.view ?? "live"}
        query={filters.q ?? ""}
      />

      <EventFeed
        events={filteredEvents}
        totalCases={activeCases}
        now={now}
      />

      <RightPanel
        totalCases={activeCases}
        countries={eventCountryRollup.length}
        fatalities={fatalities}
        liveEvents={filteredEvents.length}
        sourceHealth={allHealth}
        countryRollup={eventCountryRollup}
        events={filteredEvents}
        now={now}
      />

      <NewsTicker items={newsResult.items} />
    </main>
  );
}
