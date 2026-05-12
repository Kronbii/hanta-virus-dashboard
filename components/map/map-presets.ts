import type { CaseEventStatus } from "@/lib/types";

export type ScaleType = "quantize" | "quantile";

export interface BasemapPreset {
  label: string;
  land: string;
  labels: string | null;
  attribution: string;
}

export const BASEMAP_PRESETS: Record<string, BasemapPreset> = {
  "carto-dark": {
    label: "CARTO Dark (current)",
    land: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    labels: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
  "carto-positron": {
    label: "CARTO Light (Positron)",
    land: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    labels: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
  "carto-voyager": {
    label: "CARTO Voyager (color)",
    land: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    labels:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
  osm: {
    label: "OpenStreetMap",
    land: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  "esri-imagery": {
    label: "ESRI World Imagery (satellite)",
    land: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: null,
    attribution: "© Esri, Maxar, Earthstar Geographics",
  },
  "stadia-toner": {
    label: "Stamen Toner (B/W)",
    land: "https://tiles.stadiamaps.com/tiles/stamen_toner_background/{z}/{x}/{y}.png",
    labels: "https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png",
    attribution:
      '© <a href="https://stadiamaps.com/">Stadia Maps</a> · © <a href="https://stamen.com/">Stamen</a> · © OSM',
  },
};

export type RampKey =
  | "blue-deep"
  | "red-hot"
  | "magma"
  | "viridis"
  | "mono-gray"
  | "cyan"
  | "purple";

export const RAMP_PRESETS: Record<RampKey, [string, string, string, string, string]> = {
  "blue-deep": ["#16243d", "#1f3458", "#2c4d80", "#4a78b8", "#6da6ec"],
  "red-hot": ["#3b0a0a", "#6e1313", "#a52121", "#d44a4a", "#ff8585"],
  magma: ["#000004", "#5b126e", "#b73779", "#fc8961", "#fcfdbf"],
  viridis: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
  "mono-gray": ["#1a1a1a", "#404040", "#737373", "#a3a3a3", "#d4d4d4"],
  cyan: ["#0a1a2a", "#0e3050", "#1a5780", "#3899c0", "#7adee8"],
  purple: ["#150028", "#3a0a5c", "#6e1a8e", "#a83bb8", "#d678e6"],
};

export const DEFAULT_MARKER_COLORS: Record<CaseEventStatus, string> = {
  DECEASED: "#e23b3b",
  CONFIRMED: "#f6a623",
  PROBABLE: "#cbd5e1",
  SUSPECTED: "#cbd5e1",
  MONITORING: "#9ca3af",
  RECOVERED: "#4ade80",
  UNKNOWN: "#6b7280",
};

export const DEFAULT_MARKER_RADII: Record<CaseEventStatus, number> = {
  DECEASED: 7,
  CONFIRMED: 6,
  PROBABLE: 5,
  SUSPECTED: 5,
  MONITORING: 4,
  RECOVERED: 5,
  UNKNOWN: 4,
};

export interface MapStyleConfig {
  basemapKey: keyof typeof BASEMAP_PRESETS;
  showLabels: boolean;

  rampKey: RampKey;
  fillOpacity: number;
  emptyOpacity: number;
  borderColor: string;
  borderWeight: number;
  hoverColor: string;
  hoverWeight: number;

  markerColors: Record<CaseEventStatus, string>;
  markerSizeScale: number;
  markerBorderColor: string;
  markerBorderWeight: number;
  markerFillOpacity: number;

  minZoom: number;
  maxZoom: number;
  worldCopyJump: boolean;
  zoomAnimation: boolean;
  zoomControl: boolean;
  wheelDebounceTime: number;

  glowEnabled: boolean;
  glowColor1: string;
  glowColor2: string;
}

export const DEFAULT_MAP_CONFIG: MapStyleConfig = {
  basemapKey: "carto-dark",
  showLabels: true,

  rampKey: "blue-deep",
  fillOpacity: 0.55,
  emptyOpacity: 0,
  borderColor: "#22324e",
  borderWeight: 0.4,
  hoverColor: "#C800DF",
  hoverWeight: 1.5,

  markerColors: DEFAULT_MARKER_COLORS,
  markerSizeScale: 1,
  markerBorderColor: "#0A0A0A",
  markerBorderWeight: 1,
  markerFillOpacity: 0.95,

  minZoom: 2,
  maxZoom: 7,
  worldCopyJump: true,
  zoomAnimation: true,
  zoomControl: true,
  wheelDebounceTime: 40,

  glowEnabled: true,
  glowColor1: "rgba(226, 59, 59, 0.07)",
  glowColor2: "rgba(56, 189, 248, 0.05)",
};
