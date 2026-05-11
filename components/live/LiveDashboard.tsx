import { connection } from "next/server";
import { aggregateCases } from "@/lib/aggregator/cases";
import { aggregateCaseEvents } from "@/lib/aggregator/case-events";
import { aggregateNews } from "@/lib/aggregator/news";
import type { CaseEvent } from "@/lib/types";
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

const CASES_STATUS_SET = new Set(["CONFIRMED", "PROBABLE", "SUSPECTED"]);

function applyEventFilters(events: CaseEvent[], filters: DashboardFilters): CaseEvent[] {
  let out = events;
  if (filters.view === "cases") {
    out = out.filter((e) => CASES_STATUS_SET.has(e.status));
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

  const totalCases = casesResult.countries.reduce(
    (acc, c) => acc + c.totalCases,
    0,
  );

  const fatalities = filteredEvents.filter((e) => e.status === "DECEASED").length;

  const tracked = casesResult.countries.length + filteredEvents.length;

  const allHealth = [
    ...casesResult.health,
    ...eventsResult.health,
    ...newsResult.health,
  ];

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <LiveMap countries={casesResult.countries} events={filteredEvents} />

      <TopBar
        trackedCount={tracked}
        view={filters.view ?? "live"}
        query={filters.q ?? ""}
      />

      <EventFeed
        events={filteredEvents}
        totalCases={totalCases}
        now={now}
      />

      <RightPanel
        totalCases={totalCases}
        countries={casesResult.countries.length}
        fatalities={fatalities}
        liveEvents={filteredEvents.length}
        sourceHealth={allHealth}
        countryRollup={casesResult.countries}
        events={filteredEvents}
        now={now}
      />

      <NewsTicker items={newsResult.items} />
    </main>
  );
}
