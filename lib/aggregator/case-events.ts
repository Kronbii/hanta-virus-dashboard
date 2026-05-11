import { fetchArcgisHondius } from "@/lib/sources/arcgis-cases";
import type { CaseEvent, EventSource, SourceHealth } from "@/lib/types";
import type { SourceFetchResult } from "@/lib/sources/result";

export interface CaseEventsResult {
  events: CaseEvent[];
  health: SourceHealth[];
}

interface SourceSpec {
  name: EventSource;
  fetch: () => Promise<SourceFetchResult<CaseEvent>>;
}

const SOURCES: SourceSpec[] = [
  { name: "ARCGIS_HONDIUS", fetch: fetchArcgisHondius },
];

export async function aggregateCaseEvents(): Promise<CaseEventsResult> {
  const results = await Promise.all(
    SOURCES.map(async (s) => ({ name: s.name, result: await s.fetch() })),
  );
  const events = results
    .flatMap((r) => r.result.items)
    .sort((a, b) => {
      const at = a.onset ? new Date(a.onset).getTime() : 0;
      const bt = b.onset ? new Date(b.onset).getTime() : 0;
      return bt - at;
    });
  return {
    events,
    health: results.map(({ name, result }) => ({
      source: name,
      ok: result.ok,
      fetchedAt: result.fetchedAt,
      items: result.items.length,
      error: result.error,
    })),
  };
}
