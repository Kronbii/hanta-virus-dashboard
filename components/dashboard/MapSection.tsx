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
        className="mt-6 rounded-sm p-4 sm:p-6"
        style={{ background: "var(--paper)", color: "var(--fg)" }}
      >
        {countries.length === 0 ? (
          <p
            className="serif py-12 text-center text-sm italic"
            style={{ color: "var(--muted)" }}
          >
            No country totals available — sources may be temporarily
            unreachable.
          </p>
        ) : (
          <ChoroplethMap
            data={countries}
            colorRamp={RAMP}
            emptyColor="var(--paper)"
            oceanColor="transparent"
            borderColor="var(--fg)"
            graticuleColor="transparent"
            hoverColor="var(--accent)"
            highlightIso3={highlightIso3}
            interactive
          />
        )}
      </div>

      <p
        className="serif mt-4 text-sm italic"
        style={{ color: "var(--muted)" }}
      >
        Choropleth shading reflects cumulative reported cases across all
        integrated sources. Countries shown in the paper tone have no records
        in this dataset. Click a country to filter the news feed.
      </p>
    </section>
  );
}
