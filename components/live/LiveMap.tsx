import { ChoroplethMap } from "@/components/map/ChoroplethMap";
import type { CaseEvent, CountryAggregate } from "@/lib/types";

interface Props {
  countries: CountryAggregate[];
  events: CaseEvent[];
}

// Live-tracker choropleth ramp (5 stops, deep → bright)
const RAMP: [string, string, string, string, string] = [
  "#16243d",
  "#1f3458",
  "#2c4d80",
  "#4a78b8",
  "#6da6ec",
];

export function LiveMap({ countries, events }: Props) {
  return (
    <div className="absolute inset-0 z-0 live-map">
      <ChoroplethMap
        className="live-map"
        data={countries}
        events={events}
        colorRamp={RAMP}
        emptyColor="#0e1a2c"
        borderColor="#22324e"
        hoverColor="#f6a623"
      />
      {/* radial glow overlay to lift hot-zones visually */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(226, 59, 59, 0.07), transparent 55%), radial-gradient(ellipse at 25% 70%, rgba(56, 189, 248, 0.05), transparent 55%)",
        }}
      />
    </div>
  );
}
