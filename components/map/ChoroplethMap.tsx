"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import topology from "world-atlas/countries-110m.json";
import { numericToAlpha3 } from "@/lib/iso-numeric";
import type { CountryAggregate } from "@/lib/types";

export interface ChoroplethMapProps {
  data: CountryAggregate[];
  /** 5-step color ramp from low → high case counts. */
  colorRamp: [string, string, string, string, string];
  /** Color used for countries with zero / unknown data. */
  emptyColor: string;
  /** Color used for ocean / sphere. */
  oceanColor?: string;
  /** Color used for borders. */
  borderColor?: string;
  /** Color used for graticule lines. Set to "transparent" to hide. */
  graticuleColor?: string;
  /** Hover stroke color. Defaults to `currentColor`. */
  hoverColor?: string;
  /** ISO3 of a currently-highlighted country (set by ?country= filter). */
  highlightIso3?: string;
  /** Whether clicking a country sets the ?country= filter in the URL. */
  interactive?: boolean;
  /** Optional className for the wrapper. */
  className?: string;
}

interface GeoFeature {
  rsmKey: string;
  id: string;
  properties: { name: string };
}

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  cases: number | null;
}

export function ChoroplethMap({
  data,
  colorRamp,
  emptyColor,
  oceanColor = "transparent",
  borderColor = "currentColor",
  graticuleColor = "transparent",
  hoverColor = "currentColor",
  highlightIso3,
  interactive = false,
  className,
}: ChoroplethMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const byIso3 = useMemo(() => {
    const m = new Map<string, CountryAggregate>();
    for (const d of data) m.set(d.iso3, d);
    return m;
  }, [data]);

  const max = useMemo(
    () => data.reduce((acc, d) => (d.totalCases > acc ? d.totalCases : acc), 0),
    [data],
  );

  const colorScale = useMemo(
    () => scaleQuantize<string>().domain([1, Math.max(max, 1)]).range(colorRamp),
    [max, colorRamp],
  );

  const [hover, setHover] = useState<HoverInfo | null>(null);

  const onSelect = (iso3: string | undefined) => {
    if (!interactive) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (!iso3 || params.get("country") === iso3) params.delete("country");
    else params.set("country", iso3);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className={`choropleth relative ${className ?? ""}`}>
      <ComposableMap
        projectionConfig={{ scale: 155 }}
        width={900}
        height={500}
        style={{ width: "100%", height: "auto" }}
      >
        <Sphere id="rsm-sphere" stroke={borderColor} strokeWidth={0.5} fill={oceanColor} />
        <Graticule stroke={graticuleColor} strokeWidth={0.3} />
        <Geographies geography={topology as Record<string, unknown>}>
          {({ geographies }: { geographies: GeoFeature[] }) =>
            geographies.map((geo) => {
              const iso3 = numericToAlpha3(geo.id);
              const country = iso3 ? byIso3.get(iso3) : undefined;
              const fill = country ? colorScale(country.totalCases) : emptyColor;
              const accessibleLabel = country
                ? `${geo.properties.name}: ${country.totalCases.toLocaleString()} cases`
                : `${geo.properties.name}: no data`;
              const isHighlighted = highlightIso3 != null && iso3 === highlightIso3;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isHighlighted ? hoverColor : borderColor}
                  strokeWidth={isHighlighted ? 1.5 : 0.4}
                  tabIndex={country ? 0 : -1}
                  role={country ? "button" : "img"}
                  aria-label={accessibleLabel}
                  data-highlight={isHighlighted ? "true" : undefined}
                  onClick={() => country && onSelect(iso3)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if ((e.key === "Enter" || e.key === " ") && country) {
                      e.preventDefault();
                      onSelect(iso3);
                    }
                  }}
                  onMouseMove={(e: React.MouseEvent) =>
                    setHover({
                      x: e.clientX,
                      y: e.clientY,
                      name: geo.properties.name,
                      cases: country ? country.totalCases : null,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onFocus={() =>
                    setHover({
                      x: 0,
                      y: 0,
                      name: geo.properties.name,
                      cases: country ? country.totalCases : null,
                    })
                  }
                  onBlur={() => setHover(null)}
                  style={{
                    default: { outline: "none", transition: "fill 120ms, stroke-width 120ms" },
                    hover: { fill, outline: "none", stroke: hoverColor, strokeWidth: 1, cursor: country && interactive ? "pointer" : "default" },
                    pressed: { outline: "none" },
                  }}
                >
                  <title>{accessibleLabel}</title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hover && hover.x !== 0 && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed z-50 rounded-md border border-current/30 bg-[var(--tooltip-bg,inherit)] px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-semibold">{hover.name}</div>
          <div className="opacity-80">
            {hover.cases == null ? "No data" : `${hover.cases.toLocaleString()} cases`}
          </div>
        </div>
      )}
    </div>
  );
}
