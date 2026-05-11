import { aggregateCases } from "@/lib/aggregator/cases";
import { aggregateNews } from "@/lib/aggregator/news";
import { Stats } from "./Stats";
import { MapSection } from "./MapSection";
import { CountryTable } from "./CountryTable";
import { NewsFeed } from "./NewsFeed";
import { SourceCitations } from "./SourceCitations";

interface Props {
  searchParamsPromise: Promise<{ country?: string | string[] }>;
}

function pickCountry(raw: string | string[] | undefined): string | undefined {
  if (!raw) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  if (!/^[A-Z]{3}$/.test(value)) return undefined;
  return value;
}

export async function DataPanel({ searchParamsPromise }: Props) {
  const params = await searchParamsPromise;
  const filterIso3 = pickCountry(params.country);

  const [casesResult, newsResult] = await Promise.all([
    aggregateCases(),
    aggregateNews(filterIso3),
  ]);

  const totalCases = casesResult.countries.reduce(
    (acc, c) => acc + c.totalCases,
    0,
  );
  const lastUpdated = casesResult.countries.reduce<string | null>((acc, c) => {
    if (!acc) return c.lastUpdated;
    return new Date(c.lastUpdated) > new Date(acc) ? c.lastUpdated : acc;
  }, null);

  return (
    <>
      <Stats
        totalCases={totalCases}
        countries={casesResult.countries.length}
        lastUpdated={lastUpdated}
      />
      <MapSection
        countries={casesResult.countries}
        highlightIso3={filterIso3}
      />
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-16 sm:px-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="serif border-b rule pb-3 text-2xl font-medium">
            Leading countries
          </h2>
          <CountryTable
            countries={casesResult.countries}
            selectedIso3={filterIso3}
          />
        </div>
        <div>
          <h2 className="serif border-b rule pb-3 text-2xl font-medium">
            From the field
          </h2>
          <div className="mt-4">
            <NewsFeed items={newsResult.items} filterIso3={filterIso3} />
          </div>
        </div>
      </section>
      <SourceCitations
        health={[...casesResult.health, ...newsResult.health]}
      />
    </>
  );
}
