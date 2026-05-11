import { ChoroplethMap } from "@/components/map/ChoroplethMap";
import { StatusLegend } from "@/components/map/StatusLegend";
import type { CaseEvent, CountryAggregate } from "@/lib/types";

const RAMP: [string, string, string, string, string] = [
  "#F2D6CB",
  "#E4A48F",
  "#D17557",
  "#B5462B",
  "#7A2F1C",
];

interface Props {
  countries: CountryAggregate[];
  events: CaseEvent[];
  highlightIso3?: string;
}

export function MapSection({ countries, events, highlightIso3 }: Props) {
  const hasMapContent = countries.length > 0 || events.length > 0;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12 sm:px-10">
      <div className="flex items-end justify-between border-b rule pb-3">
        <div>
          <div
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: "var(--accent)" }}
          >
            Live tracker
          </div>
          <h2 className="serif mt-1 text-2xl font-medium">Outbreak map</h2>
        </div>
        <p className="serif hidden text-sm italic sm:block" style={{ color: "var(--muted)" }}>
          {events.length.toLocaleString()} tracked cases · drag, scroll to zoom
        </p>
      </div>

      <div
        className="mt-6 rounded-sm p-1 sm:p-2"
        style={{ background: "var(--paper)", color: "var(--fg)" }}
      >
        {!hasMapContent ? (
          <p
            className="serif py-24 text-center text-sm italic"
            style={{ color: "var(--muted)" }}
          >
            No country totals or live cases available — sources may be
            temporarily unreachable.
          </p>
        ) : (
          <div className="choropleth">
            <ChoroplethMap
              data={countries}
              events={events}
              colorRamp={RAMP}
              emptyColor="#1A1714"
              highlightIso3={highlightIso3}
              interactive
            />
            <StatusLegend events={events} />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p
          className="serif text-sm italic"
          style={{ color: "var(--muted)" }}
        >
          Each pin is one individual case from the MV Hondius cluster, colored
          by status. Country shading reflects cumulative totals across WHO and
          CDC feeds. Click a country to filter the news feed.
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
