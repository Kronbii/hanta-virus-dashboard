import { fetchWhoDon } from "@/lib/sources/who-don";
import { fetchCdc } from "@/lib/sources/cdc";
import { iso3ToName } from "@/lib/aggregator/country-codes";
import type {
  CaseRecord,
  CaseSource,
  CountryAggregate,
  SourceHealth,
} from "@/lib/types";
import type { SourceFetchResult } from "@/lib/sources/result";

export interface CasesResult {
  countries: CountryAggregate[];
  records: CaseRecord[];
  health: SourceHealth[];
}

interface SourceSpec {
  name: CaseSource;
  fetch: () => Promise<SourceFetchResult<CaseRecord>>;
}

const SOURCES: SourceSpec[] = [
  { name: "WHO_DON", fetch: fetchWhoDon },
  { name: "CDC", fetch: fetchCdc },
];

function rollup(records: CaseRecord[]): CountryAggregate[] {
  type Bucket = {
    iso3: string;
    name: string;
    perSource: Map<CaseSource, number>;
    lastUpdated: string;
    sources: Set<CaseSource>;
  };

  const buckets = new Map<string, Bucket>();
  for (const r of records) {
    let bucket = buckets.get(r.countryIso3);
    if (!bucket) {
      bucket = {
        iso3: r.countryIso3,
        name: iso3ToName(r.countryIso3),
        perSource: new Map(),
        lastUpdated: r.dateReported,
        sources: new Set(),
      };
      buckets.set(r.countryIso3, bucket);
    }
    const prev = bucket.perSource.get(r.source) ?? 0;
    if (r.count > prev) bucket.perSource.set(r.source, r.count);
    bucket.sources.add(r.source);
    if (new Date(r.dateReported) > new Date(bucket.lastUpdated)) {
      bucket.lastUpdated = r.dateReported;
    }
  }

  return Array.from(buckets.values())
    .map((b) => ({
      iso3: b.iso3,
      name: b.name,
      totalCases: Array.from(b.perSource.values()).reduce((a, n) => a + n, 0),
      lastUpdated: b.lastUpdated,
      sources: Array.from(b.sources),
    }))
    .sort((a, b) => b.totalCases - a.totalCases);
}

export async function aggregateCases(): Promise<CasesResult> {
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      const r = await s.fetch();
      return { name: s.name, result: r };
    }),
  );
  const allRecords = results.flatMap((r) => r.result.items);
  return {
    countries: rollup(allRecords),
    records: allRecords,
    health: results.map(({ name, result }) => ({
      source: name,
      ok: result.ok,
      fetchedAt: result.fetchedAt,
      items: result.items.length,
      error: result.error,
    })),
  };
}
