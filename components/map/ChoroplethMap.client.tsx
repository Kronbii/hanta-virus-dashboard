"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LeafletGeoJSON } from "leaflet";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import L, { type PathOptions } from "leaflet";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Marker,
  Popup,
  Pane,
  LayerGroup,
  useMap,
  useMapEvents,
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
  /** Whether the left/right floating panels are visible — affects fit padding. */
  feedVisible?: boolean;
  panelVisible?: boolean;
  // ── Sandbox / customization knobs (all optional, defaults match current look)
  tileLandUrl?: string;
  tileLabelsUrl?: string | null;
  tileAttribution?: string;
  fillOpacity?: number;
  emptyOpacity?: number;
  borderWeight?: number;
  hoverWeight?: number;
  markerColors?: Record<CaseEventStatus, string>;
  markerRadii?: Record<CaseEventStatus, number>;
  markerSizeScale?: number;
  markerBorderColor?: string;
  markerBorderWeight?: number;
  markerFillOpacity?: number;
  minZoom?: number;
  maxZoom?: number;
  worldCopyJump?: boolean;
  zoomAnimation?: boolean;
  zoomControl?: boolean;
  wheelDebounceTime?: number;
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
function FitToEvents({
  events,
  feedVisible = true,
  panelVisible = true,
}: {
  events: CaseEvent[];
  feedVisible?: boolean;
  panelVisible?: boolean;
}) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    if (events.length === 0) return;
    const points = events.map(
      (e) => [e.coordinates[1], e.coordinates[0]] as [number, number],
    );
    const bounds = L.latLngBounds(points);
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    map.fitBounds(bounds, {
      paddingTopLeft: [isMobile ? 16 : feedVisible ? 392 : 32, 80],
      paddingBottomRight: [isMobile ? 16 : panelVisible ? 352 : 32, 72],
      maxZoom: 3,
      animate: false,
    });
    didFit.current = true;
  }, [events, map, feedVisible, panelVisible]);
  return null;
}

interface CountryLabel {
  iso3: string;
  name: string;
  center: [number, number]; // [lon, lat]
  bboxWidth: number;
}

/**
 * In-house country name labels (replaces CARTO's pre-rendered label tiles).
 * Renders each name as a DivIcon marker at the country's centroid, in a
 * dedicated Leaflet pane above the markers. Style via `.country-label` in
 * globals.css. Zoom-aware filtering: at low zoom we only label the larger
 * countries to keep the map from drowning in text.
 */
function CountryLabelsLayer({ labels }: { labels: CountryLabel[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });
  const minWidth = zoom <= 2 ? 18 : zoom <= 3 ? 10 : zoom <= 4 ? 5 : zoom <= 5 ? 2 : 0;
  return (
    <Pane name="country-labels" style={{ zIndex: 650, pointerEvents: "none" }}>
      {labels
        .filter((l) => l.bboxWidth >= minWidth)
        .map((l) => (
          <Marker
            key={l.iso3}
            position={[l.center[1], l.center[0]]}
            interactive={false}
            keyboard={false}
            icon={L.divIcon({
              className: "country-label",
              html: `<span>${l.name}</span>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            })}
          />
        ))}
    </Pane>
  );
}

/**
 * Clears `?country=` when the user clicks anywhere on the map background
 * (ocean / land outside any rendered country polygon). Country polygon
 * clicks stop propagation in their own handler, so this only fires for
 * genuine background clicks.
 */
function MapBackgroundClickClear({ onClear }: { onClear: () => void }) {
  useMapEvents({
    click: () => onClear(),
  });
  return null;
}

// Area-weighted centroid of a single polygon ring (shoelace formula).
// Much better than average-of-points: vertex-dense coastlines no longer
// pull the centroid toward the shore.
function polygonAreaCentroid(
  ring: number[][],
): { cx: number; cy: number; area: number } {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    // Degenerate ring — fall back to first vertex so we don't divide by 0.
    return { cx: ring[0]?.[0] ?? 0, cy: ring[0]?.[1] ?? 0, area: 0 };
  }
  const factor = 1 / (6 * area);
  return { cx: cx * factor, cy: cy * factor, area: Math.abs(area) };
}

function featureCentroid(feature: Feature<Geometry, unknown>): [number, number] | null {
  const g = feature.geometry;
  if (g.type === "Polygon") {
    const c = polygonAreaCentroid(g.coordinates[0]);
    return [c.cx, c.cy];
  }
  if (g.type === "MultiPolygon") {
    // For multi-part countries (USA + Alaska + Hawaii, France + overseas,
    // Indonesia's archipelago) label the LARGEST landmass by area.
    let best: { cx: number; cy: number; area: number } | null = null;
    for (const poly of g.coordinates) {
      const c = polygonAreaCentroid(poly[0]);
      if (!best || c.area > best.area) best = c;
    }
    return best ? [best.cx, best.cy] : null;
  }
  return null;
}

// Approximate longitudinal width of a feature's bounding box. Used as a
// crude proxy for "is this country big enough to bother labeling at low
// zoom" — at higher zooms we show everything.
function featureBboxWidth(feature: Feature<Geometry, unknown>): number {
  let min = Infinity;
  let max = -Infinity;
  const visit = (ring: number[][]) => {
    for (const [x] of ring) {
      if (x < min) min = x;
      if (x > max) max = x;
    }
  };
  const g = feature.geometry;
  if (g.type === "Polygon") visit(g.coordinates[0]);
  else if (g.type === "MultiPolygon") {
    for (const p of g.coordinates) visit(p[0]);
  }
  return max - min;
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
  feedVisible = true,
  panelVisible = true,
  tileLandUrl = TILE_LAND,
  // Default to null — country names are rendered as in-house DivIcon labels
  // (see countryLabels below) so they can be styled via the .country-label
  // class in globals.css.
  tileLabelsUrl = null,
  tileAttribution = TILE_ATTRIBUTION,
  fillOpacity = 0.55,
  emptyOpacity = 0,
  borderWeight = 0.4,
  hoverWeight = 1.5,
  markerColors = STATUS_COLOR,
  markerRadii = STATUS_RADIUS,
  markerSizeScale = 1,
  markerBorderColor = "#0A0A0A",
  markerBorderWeight = 1,
  markerFillOpacity = 0.95,
  minZoom = 2,
  maxZoom = 7,
  worldCopyJump = true,
  zoomAnimation = true,
  zoomControl = true,
  wheelDebounceTime = 40,
}: ChoroplethMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Live-tracker palette — navy borders, magenta hover.
  const effectiveBorder = borderColor ?? "#22324e";
  const effectiveHover = hoverColor ?? "#C800DF";
  // Treat ?country=ISO3 as the live highlight when no explicit prop is supplied.
  const effectiveHighlight =
    highlightIso3 ?? searchParams?.get("country") ?? undefined;

  const onClearCountry = useCallback(() => {
    if (!interactive) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (!params.has("country")) return;
    params.delete("country");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [interactive, router, pathname, searchParams]);

  // Escape clears the country selection — works anywhere on the page so long
  // as no input is consuming the key.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      onClearCountry();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClearCountry]);

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

  // Pre-compute country label data (centroid + name + bbox width). The world
  // GeoJSON is a module constant so this is computed once per component.
  const countryLabels = useMemo<CountryLabel[]>(() => {
    const out: CountryLabel[] = [];
    for (const f of WORLD_GEOJSON.features) {
      const iso3 = numericToAlpha3(f.id as string | number | undefined);
      const name = (f.properties as { name?: string } | null)?.name;
      if (!iso3 || !name) continue;
      const center = featureCentroid(f);
      if (!center) continue;
      out.push({ iso3, name, center, bboxWidth: featureBboxWidth(f) });
    }
    return out;
  }, []);

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

  const baseStyleFor = useCallback(
    (feature: Feature<Geometry, unknown> | undefined): PathOptions => {
      if (!feature) return {};
      const { byIso3, colorScale, highlightIso3 } = closuresRef.current;
      const iso3 = numericToAlpha3(feature.id as string | number | undefined);
      const country = iso3 ? byIso3.get(iso3) : undefined;
      const isHighlight = !!highlightIso3 && iso3 === highlightIso3;
      if (!country) {
        return {
          color: effectiveBorder,
          weight: borderWeight,
          fillColor: emptyColor,
          fillOpacity: emptyOpacity,
        };
      }
      return {
        color: isHighlight ? effectiveHover : effectiveBorder,
        weight: isHighlight ? hoverWeight : borderWeight,
        fillColor: colorScale(country.totalCases),
        fillOpacity,
      };
    },
    [effectiveBorder, effectiveHover, emptyColor, borderWeight, hoverWeight, fillOpacity, emptyOpacity],
  );

  // Imperatively restyle the GeoJSON layer when highlight/data changes — much
  // cheaper than unmounting/remounting the layer on every country click.
  const geoJsonRef = useRef<LeafletGeoJSON | null>(null);
  useEffect(() => {
    const gj = geoJsonRef.current;
    if (!gj) return;
    gj.eachLayer((layer) => {
      const f = (layer as L.Layer & { feature?: Feature<Geometry, unknown> }).feature;
      if (f) (layer as L.Path).setStyle(baseStyleFor(f));
    });
  }, [effectiveHighlight, data, baseStyleFor]);

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
      click: (e) => {
        // Stop propagation so MapBackgroundClickClear doesn't fire and
        // immediately clear the country we just selected.
        L.DomEvent.stopPropagation(e as unknown as Event);
        closuresRef.current.onSelect(iso3);
      },
      mouseover: () => {
        path.setStyle({ weight: hoverWeight, color: effectiveHover, fillOpacity: Math.min(1, fillOpacity + 0.15) });
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

  // Structural changes (minZoom/maxZoom/worldCopyJump/zoomAnimation/zoomControl)
  // can't be applied to a Leaflet map after init, so key the MapContainer on them
  // to force a remount. Style/color/marker changes flow through props as usual.
  const mapKey = `${minZoom}-${maxZoom}-${worldCopyJump}-${zoomAnimation}-${zoomControl}`;

  return (
    <MapContainer
      key={mapKey}
      className={className}
      center={[20, 0]}
      zoom={Math.max(minZoom, 2)}
      minZoom={minZoom}
      maxZoom={maxZoom}
      // Canvas renderer is dramatically faster than SVG when redrawing many
      // polygons + markers on zoom — avoids per-path d-attribute updates.
      preferCanvas
      // Infinite horizontal wrap — tiles repeat across world copies and the
      // map view jumps to keep GeoJSON/markers aligned. Latitude is clamped.
      worldCopyJump={worldCopyJump}
      zoomAnimation={zoomAnimation}
      // Smoother zoom: fractional steps (zoomSnap < 1) interpolate between
      // integer levels so wheel/pinch zoom no longer "snaps" jarringly. A
      // lower wheelPxPerZoomLevel makes each wheel tick produce a smaller
      // zoom delta, which combined with zoomSnap = 0.25 feels continuous.
      zoomSnap={0.25}
      zoomDelta={0.5}
      scrollWheelZoom
      wheelDebounceTime={wheelDebounceTime}
      wheelPxPerZoomLevel={60}
      zoomControl={zoomControl}
      attributionControl
      // Latitude clamped, longitude free — worldCopyJump handles the wrap.
      maxBounds={[
        [-85, -720],
        [85, 720],
      ]}
      maxBoundsViscosity={0}
      style={{ height: "100%", width: "100%" }}
    >
      <ResizeOnMount />
      <FitToEvents
        events={events}
        feedVisible={feedVisible}
        panelVisible={panelVisible}
      />
      <MapBackgroundClickClear onClear={onClearCountry} />

      {/* Base land tiles. Tiles repeat across world copies. */}
      <TileLayer
        key={tileLandUrl}
        url={tileLandUrl}
        attribution={tileAttribution}
        keepBuffer={4}
      />

      {/* Subtle choropleth — country shading under the markers. */}
      <GeoJSON
        ref={geoJsonRef}
        data={WORLD_GEOJSON}
        style={baseStyleFor}
        onEachFeature={onEachFeature}
      />

      {/* Status-colored case-event markers. */}
      <LayerGroup>
        {events.map((ev) => {
          const fill = markerColors[ev.status];
          const radius = markerRadii[ev.status] * markerSizeScale;
          return (
            <CircleMarker
              key={ev.id}
              center={[ev.coordinates[1], ev.coordinates[0]]}
              radius={radius}
              pathOptions={{
                color: markerBorderColor,
                weight: markerBorderWeight,
                fillColor: fill,
                fillOpacity: markerFillOpacity,
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

      {/* Optional pre-rendered label tiles (off by default — we render our
          own labels below). Pass a tileLabelsUrl to re-enable CARTO labels. */}
      {tileLabelsUrl ? (
        <Pane name="tile-labels" style={{ zIndex: 640, pointerEvents: "none" }}>
          <TileLayer key={tileLabelsUrl} url={tileLabelsUrl} />
        </Pane>
      ) : null}

      {/* In-house country labels — edit appearance via .country-label
          in globals.css (font, color, shadow, casing, size). */}
      <CountryLabelsLayer labels={countryLabels} />
    </MapContainer>
  );
}
