"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import L, { type PathOptions } from "leaflet";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  Pane,
  LayerGroup,
  useMap,
} from "react-leaflet";
import { scaleQuantize } from "d3-scale";
import type { Feature, Geometry } from "geojson";
import { WORLD_GEOJSON } from "@/lib/topo-to-geojson";
import { numericToAlpha3 } from "@/lib/iso-numeric";
import type { CaseEvent, CaseEventStatus, CountryAggregate } from "@/lib/types";

export interface ChoroplethMapProps {
  data: CountryAggregate[];
  events: CaseEvent[];
  colorRamp: [string, string, string, string, string];
  emptyColor: string;
  borderColor?: string;
  hoverColor?: string;
  highlightIso3?: string;
  /** When true (default) clicking a country sets ?country= in the URL. */
  interactive?: boolean;
  className?: string;
}

// Dark editorial basemap — split into land and label tile layers so the
// label tiles sit above the markers (matching Esri's Human Geography Dark
// layered approach used by the ArcGIS Hondius dashboard).
const TILE_LAND =
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
const TILE_LABELS =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>';

// Status palette — live-tracker / OSINT board. Hot red for fatal, amber for
// confirmed, slate for suspect+probable (merged), dim green for recovered.
const STATUS_COLOR: Record<CaseEventStatus, string> = {
  DECEASED: "#e23b3b",
  CONFIRMED: "#f6a623",
  PROBABLE: "#cbd5e1",
  SUSPECTED: "#cbd5e1",
  MONITORING: "#9ca3af",
  RECOVERED: "#4ade80",
  UNKNOWN: "#6b7280",
};

const STATUS_RADIUS: Record<CaseEventStatus, number> = {
  DECEASED: 7,
  CONFIRMED: 6,
  PROBABLE: 5,
  SUSPECTED: 5,
  MONITORING: 4,
  RECOVERED: 5,
  UNKNOWN: 4,
};

/**
 * Defensive resize: when the map mounts inside a streaming Suspense
 * boundary the container can be sized 0×0 for a frame, leaving Leaflet
 * with stale tile math. Call invalidateSize on next tick.
 */
function ResizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 50);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

/**
 * Fit the map to the bounding box of all case events on initial load. Uses
 * asymmetric padding that matches the OSINT live-tracker chrome (left feed
 * panel ~376px wide, right panel ~336px wide, top bar 48px, ticker 40px) so
 * pins never end up hidden behind the floating panels. Caps zoom so a tight
 * cluster doesn't fly the user out of the global context.
 */
function FitToEvents({ events }: { events: CaseEvent[] }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    if (events.length === 0) return;
    const points = events.map(
      (e) => [e.coordinates[1], e.coordinates[0]] as [number, number],
    );
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      paddingTopLeft: [392, 80],
      paddingBottomRight: [352, 72],
      maxZoom: 3,
      animate: false,
    });
    didFit.current = true;
  }, [events, map]);
  return null;
}

function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusLabel(s: CaseEventStatus): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function ChoroplethMap({
  data,
  events,
  colorRamp,
  emptyColor,
  borderColor,
  hoverColor,
  highlightIso3,
  interactive = true,
  className,
}: ChoroplethMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Live-tracker palette — navy borders, amber hover.
  const effectiveBorder = borderColor ?? "#22324e";
  const effectiveHover = hoverColor ?? "#f6a623";
  // Treat ?country=ISO3 as the live highlight when no explicit prop is supplied.
  const effectiveHighlight =
    highlightIso3 ?? searchParams?.get("country") ?? undefined;

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

  // Closures-via-ref so onEachFeature (bound once per feature) sees latest data.
  const closuresRef = useRef({ byIso3, colorScale, highlightIso3: effectiveHighlight, onSelect });
  closuresRef.current = { byIso3, colorScale, highlightIso3: effectiveHighlight, onSelect };

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
        color: effectiveBorder,
        weight: 0.4,
        fillColor: emptyColor,
        fillOpacity: 0,
      };
    }
    return {
      color: isHighlight ? effectiveHover : effectiveBorder,
      weight: isHighlight ? 1.5 : 0.4,
      fillColor: colorScale(country.totalCases),
      fillOpacity: 0.55,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, unknown>, layer: L.Layer) => {
    const iso3 = numericToAlpha3(feature.id as string | number | undefined);
    const country = iso3 ? closuresRef.current.byIso3.get(iso3) : undefined;
    const featureName = (feature.properties as { name?: string } | null)?.name;
    const displayName = country?.name ?? featureName ?? "Unknown";

    const tooltip = country
      ? `<strong>${displayName}</strong><br/>${country.totalCases.toLocaleString()} cases (cumulative)`
      : `<strong>${displayName}</strong><br/>No country-level total`;
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
        path.setStyle({ weight: 1.5, color: effectiveHover, fillOpacity: 0.7 });
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

  // Re-key the GeoJSON layer when its data or highlight changes so style
  // closures re-bind cleanly.
  const geoKey = `${data.length}-${effectiveHighlight ?? ""}`;

  return (
    <MapContainer
      className={className}
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={7}
      worldCopyJump={false}
      scrollWheelZoom
      wheelDebounceTime={40}
      wheelPxPerZoomLevel={120}
      zoomControl
      attributionControl
      maxBounds={[
        [-85, -200],
        [85, 200],
      ]}
      maxBoundsViscosity={1}
      style={{ height: "100%", width: "100%" }}
    >
      <ResizeOnMount />
      <FitToEvents events={events} />

      {/* Dark base: land only. */}
      <TileLayer url={TILE_LAND} attribution={TILE_ATTRIBUTION} noWrap />

      {/* Subtle choropleth — country shading under the markers. */}
      <GeoJSON
        key={geoKey}
        data={WORLD_GEOJSON}
        style={baseStyleFor}
        onEachFeature={onEachFeature}
      />

      {/* Status-colored case-event markers. */}
      <LayerGroup>
        {events.map((ev) => {
          const fill = STATUS_COLOR[ev.status];
          const radius = STATUS_RADIUS[ev.status];
          return (
            <CircleMarker
              key={ev.id}
              center={[ev.coordinates[1], ev.coordinates[0]]}
              radius={radius}
              pathOptions={{
                color: "#0A0A0A",
                weight: 1,
                fillColor: fill,
                fillOpacity: 0.95,
              }}
            >
              <Popup className="case-popup">
                <div className="case-popup-body">
                  <div className="case-popup-status">
                    <span
                      aria-hidden
                      className="case-popup-dot"
                      style={{ background: fill }}
                    />
                    <span>{statusLabel(ev.status)}</span>
                    {ev.caseLabel && (
                      <span className="case-popup-label">· {ev.caseLabel}</span>
                    )}
                  </div>
                  {ev.location && (
                    <div className="case-popup-loc">{ev.location}</div>
                  )}
                  {ev.exposureGroup && (
                    <div className="case-popup-cohort">{ev.exposureGroup}</div>
                  )}
                  <dl className="case-popup-meta">
                    {formatDate(ev.onset) && (
                      <>
                        <dt>Onset</dt>
                        <dd>{formatDate(ev.onset)}</dd>
                      </>
                    )}
                    {formatDate(ev.death) && (
                      <>
                        <dt>Death</dt>
                        <dd>{formatDate(ev.death)}</dd>
                      </>
                    )}
                    {typeof ev.age === "number" && (
                      <>
                        <dt>Age</dt>
                        <dd>{ev.age}</dd>
                      </>
                    )}
                    {ev.sex === 1 && (
                      <>
                        <dt>Sex</dt>
                        <dd>Male</dd>
                      </>
                    )}
                    {ev.sex === 2 && (
                      <>
                        <dt>Sex</dt>
                        <dd>Female</dd>
                      </>
                    )}
                  </dl>
                  {ev.sourceUrl && (
                    <a
                      className="case-popup-source"
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Source ↗
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </LayerGroup>

      {/* Labels above everything else. */}
      <Pane name="labels" style={{ zIndex: 650, pointerEvents: "none" }}>
        <TileLayer url={TILE_LABELS} noWrap />
      </Pane>
    </MapContainer>
  );
}
