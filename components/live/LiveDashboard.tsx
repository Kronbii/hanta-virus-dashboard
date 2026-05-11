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

export interface DashboardFilters {
  country?: string;
  q?: string;
  view?: string;
}

// Statuses we treat as "an actual case" for the rollup KPI. MONITORING is
// "exposed but no signs of illness" — counting it inflates the headline
// number well past anything WHO or CDC would publish.
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

  const now = Date.now();

  const filteredEvents = applyEventFilters(eventsResult.events, filters);

  // The dashboard headlines reflect the current outbreak (ArcGIS Hondius),
  // not 30 years of WHO/CDC history. casesResult.* still surfaces in the
  // Source health badges so flaky upstreams are visible.
  const eventCountryRollup = rollupEventsByCountry(eventsResult.events);
  const activeCases = eventsResult.events.filter((e) =>
    ACTIVE_STATUSES.has(e.status),
  ).length;
  const fatalities = eventsResult.events.filter((e) => e.status === "DECEASED").length;

  const tracked = filteredEvents.length;

  const allHealth = [
    ...casesResult.health,
    ...eventsResult.health,
    ...newsResult.health,
  ];

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
