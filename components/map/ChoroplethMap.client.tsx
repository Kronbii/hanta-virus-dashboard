"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import L, { type PathOptions } from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { scaleQuantize } from "d3-scale";
import type { Feature, Geometry } from "geojson";
import { WORLD_GEOJSON } from "@/lib/topo-to-geojson";
import { numericToAlpha3 } from "@/lib/iso-numeric";
import type { CountryAggregate } from "@/lib/types";

export interface ChoroplethMapProps {
  data: CountryAggregate[];
  colorRamp: [string, string, string, string, string];
  emptyColor: string;
  borderColor?: string;
  hoverColor?: string;
  highlightIso3?: string;
  /** When true (default) clicking a country sets ?country= in the URL. */
  interactive?: boolean;
  className?: string;
}

const TILES = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

/**
 * Holding Shift while scrolling the page over the map zooms the map.
 * Plain scroll just scrolls the page — matches the Mapbox docs convention.
 */
function ShiftScrollZoom() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.5 : -0.5;
      map.setZoom(map.getZoom() + delta, { animate: true });
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [map]);
  return null;
}

export function ChoroplethMap({
  data,
  colorRamp,
  emptyColor,
  borderColor = "#FFFFFF",
  hoverColor = "#B5462B",
  highlightIso3,
  interactive = true,
  className,
}: ChoroplethMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();

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

  const onSelect = (iso3: string) => {
    if (!interactive) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (params.get("country") === iso3) params.delete("country");
    else params.set("country", iso3);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // We keep these in refs so onEachFeature (called once at mount per layer)
  // sees the latest closure when the data or selection changes.
  const closuresRef = useRef({ byIso3, colorScale, highlightIso3, onSelect });
  closuresRef.current = { byIso3, colorScale, highlightIso3, onSelect };

  const baseStyleFor = (
    feature: Feature<Geometry, unknown> | undefined,
  ): PathOptions => {
    if (!feature) return {};
    const { byIso3, colorScale, highlightIso3 } = closuresRef.current;
    const iso3 = numericToAlpha3(feature.id as string | number | undefined);
    const country = iso3 ? byIso3.get(iso3) : undefined;
    const isHighlight = !!highlightIso3 && iso3 === highlightIso3;
    if (!country) {
      return {
        color: borderColor,
        weight: 0.4,
        fillColor: emptyColor,
        fillOpacity: 0,
      };
    }
    return {
      color: isHighlight ? hoverColor : borderColor,
      weight: isHighlight ? 1.5 : 0.5,
      fillColor: colorScale(country.totalCases),
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, unknown>, layer: L.Layer) => {
    const iso3 = numericToAlpha3(feature.id as string | number | undefined);
    const country = iso3 ? closuresRef.current.byIso3.get(iso3) : undefined;
    const featureName = (feature.properties as { name?: string } | null)?.name;
    const displayName = country?.name ?? featureName ?? "Unknown";

    const tooltip = country
      ? `<strong>${displayName}</strong><br/>${country.totalCases.toLocaleString()} cases`
      : `<strong>${displayName}</strong><br/>No data`;
    layer.bindTooltip(tooltip, {
      direction: "top",
      sticky: true,
      offset: [0, -4],
    });

    if (!country || !iso3) return;
    const path = layer as L.Path;
    layer.on({
      click: () => closuresRef.current.onSelect(iso3),
      mouseover: () => {
        path.setStyle({ weight: 1.5, color: hoverColor });
        path.bringToFront();
      },
      mouseout: () => {
        path.setStyle(baseStyleFor(feature));
      },
      keydown: (e) => {
        const ev = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent;
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          closuresRef.current.onSelect(iso3);
        }
      },
    });
  };

  const isDark = resolvedTheme === "dark";
  const tiles = isDark ? TILES.dark : TILES.light;
  // GeoJSON key forces a remount when data length or highlight changes so
  // styleFor closes over the latest scale and selection.
  const geoKey = `${isDark ? "d" : "l"}-${data.length}-${highlightIso3 ?? ""}`;

  return (
    <MapContainer
      className={className}
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      worldCopyJump={false}
      scrollWheelZoom={false}
      zoomControl
      attributionControl
      maxBounds={[
        [-85, -200],
        [85, 200],
      ]}
      maxBoundsViscosity={1}
      style={{ height: "100%", width: "100%" }}
    >
      <ShiftScrollZoom />
      <TileLayer
        key={isDark ? "dark" : "light"}
        url={tiles.url}
        attribution={tiles.attribution}
        noWrap
      />
      <GeoJSON
        key={geoKey}
        data={WORLD_GEOJSON}
        style={baseStyleFor}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
