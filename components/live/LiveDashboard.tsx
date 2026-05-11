import { connection } from "next/server";
import { aggregateCases } from "@/lib/aggregator/cases";
import { aggregateCaseEvents } from "@/lib/aggregator/case-events";
import { aggregateNews } from "@/lib/aggregator/news";
import { TopBar } from "./TopBar";
import { EventFeed } from "./EventFeed";
import { RightPanel } from "./RightPanel";
import { NewsTicker } from "./NewsTicker";
import { LiveMap } from "./LiveMap";

export async function LiveDashboard() {
  // Opt into dynamic (request-time) rendering. Required so Date.now() can be
  // used for relative-time labels under Next.js cacheComponents mode.
  await connection();

  const [casesResult, eventsResult, newsResult] = await Promise.all([
    aggregateCases(),
    aggregateCaseEvents(),
    aggregateNews(),
  ]);

  const now = Date.now();

  const totalCases = casesResult.countries.reduce(
    (acc, c) => acc + c.totalCases,
    0,
  );

  const fatalities = eventsResult.events.filter(
    (e) => e.status === "DECEASED",
  ).length;

  const tracked = casesResult.countries.length + eventsResult.events.length;

  const allHealth = [
    ...casesResult.health,
    ...eventsResult.health,
    ...newsResult.health,
  ];

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <LiveMap countries={casesResult.countries} events={eventsResult.events} />

      <TopBar trackedCount={tracked} />

      <EventFeed
        events={eventsResult.events}
        totalCases={totalCases}
        now={now}
      />

      <RightPanel
        totalCases={totalCases}
        countries={casesResult.countries.length}
        fatalities={fatalities}
        liveEvents={eventsResult.events.length}
        sourceHealth={allHealth}
        countryRollup={casesResult.countries}
        events={eventsResult.events}
        now={now}
      />

      <NewsTicker items={newsResult.items} />
    </main>
  );
}
