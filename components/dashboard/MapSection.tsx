import { ChoroplethMap } from "@/components/map/ChoroplethMap";
import { Legend } from "@/components/map/Legend";
import type { CountryAggregate } from "@/lib/types";

const RAMP: [string, string, string, string, string] = [
  "#F2D6CB",
  "#E4A48F",
  "#D17557",
  "#B5462B",
  "#7A2F1C",
];

interface Props {
  countries: CountryAggregate[];
  highlightIso3?: string;
}

export function MapSection({ countries, highlightIso3 }: Props) {
  const max = countries.reduce(
    (acc, c) => (c.totalCases > acc ? c.totalCases : acc),
    0,
  );

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12 sm:px-10">
      <div className="flex items-end justify-between border-b rule pb-3">
        <h2 className="serif text-2xl font-medium">A world view</h2>
        {max > 0 && <Legend ramp={RAMP} max={max} label="Cases" />}
      </div>

      <div
        className="mt-6 rounded-sm p-1 sm:p-2"
        style={{ background: "var(--paper)", color: "var(--fg)" }}
      >
        {countries.length === 0 ? (
          <p
            className="serif py-24 text-center text-sm italic"
            style={{ color: "var(--muted)" }}
          >
            No country totals available — sources may be temporarily
            unreachable.
          </p>
        ) : (
          <div className="choropleth">
            <ChoroplethMap
              data={countries}
              colorRamp={RAMP}
              emptyColor="var(--bg)"
              highlightIso3={highlightIso3}
              interactive
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p
          className="serif text-sm italic"
          style={{ color: "var(--muted)" }}
        >
          Drag to pan · hold <span className="not-italic font-medium" style={{ color: "var(--fg)" }}>Shift</span> + scroll to zoom · click a country to filter the news feed.
        </p>
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Tile base: CARTO · OpenStreetMap
        </p>
      </div>
    </section>
  );
}
