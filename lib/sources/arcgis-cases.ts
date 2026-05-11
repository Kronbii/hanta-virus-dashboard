import { cacheLife, cacheTag } from "next/cache";
import { sha1 } from "@/lib/aggregator/sha1";
import { UA } from "./user-agent";
import { ok, fail, type SourceFetchResult } from "./result";
import type { CaseEvent, CaseEventStatus } from "@/lib/types";

/**
 * Community-curated ArcGIS feature service for the 2026 MV Hondius hantavirus
 * outbreak. Each feature is a per-case point with status / onset / source URL
 * fields — exactly the shape the editorial-styled map needs to plot status-
 * colored circle markers.
 *
 * Service item: `b56d9b9005eb490e85b2417e2ed2a349`
 * Used by the public ANDV Hantavirus 2026 dashboard at:
 *   arcgis.com/apps/dashboards/5c68442d2afc42d7ba2696e4cd393729
 */
const FEATURE_SERVICE =
  "https://services1.arcgis.com/wb4Og4gH5mvzQAIV/arcgis/rest/services/Tracking_Hantavirus_2026/FeatureServer/1/query";

interface ArcGisFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] } | null;
  properties: {
    CASE_?: number | null;
    STATUS?: string | null;
    AGE?: number | null;
    SEX?: number | null;
    ONSET?: number | null;
    DEATH?: number | null;
    SOURCE?: string | null;
    LASTLOCATION?: string | null;
    TCLASS?: string | null;
    Exposure_Group?: string | null;
  };
}

interface ArcGisFeatureCollection {
  type: "FeatureCollection";
  features?: ArcGisFeature[];
}

function normalizeStatus(raw: string | null | undefined): CaseEventStatus {
  if (!raw) return "UNKNOWN";
  const s = raw.trim().toUpperCase();
  if (s.includes("DECEASED") || s.includes("DEAD")) return "DECEASED";
  if (s.includes("RECOVER")) return "RECOVERED";
  if (s.includes("CONFIRM")) return "CONFIRMED";
  if (s.includes("PROBABLE")) return "PROBABLE";
  if (s.includes("SUSPECT")) return "SUSPECTED";
  if (s.includes("MONITOR")) return "MONITORING";
  return "UNKNOWN";
}

function toIsoDate(ms: number | null | undefined): string | undefined {
  if (!ms || !Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString();
}

function featureToCaseEvent(f: ArcGisFeature): CaseEvent | null {
  if (!f.geometry || f.geometry.type !== "Point") return null;
  const [lon, lat] = f.geometry.coordinates;
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  const p = f.properties ?? {};
  const status =
    p.DEATH != null ? "DECEASED" : normalizeStatus(p.STATUS ?? undefined);
  const caseLabel = p.TCLASS ?? (p.CASE_ != null ? `Case ${p.CASE_}` : undefined);
  return {
    id: sha1(`ARCGIS_HONDIUS|${lon}|${lat}|${p.CASE_ ?? p.TCLASS ?? ""}`),
    status,
    coordinates: [lon, lat],
    location: p.LASTLOCATION?.trim() || undefined,
    exposureGroup: p.Exposure_Group?.trim() || undefined,
    onset: toIsoDate(p.ONSET ?? undefined),
    death: toIsoDate(p.DEATH ?? undefined),
    age: typeof p.AGE === "number" ? p.AGE : undefined,
    sex: typeof p.SEX === "number" ? p.SEX : undefined,
    caseLabel: caseLabel ?? undefined,
    sourceUrl: p.SOURCE?.trim() || undefined,
    source: "ARCGIS_HONDIUS",
  };
}

export async function fetchArcgisHondius(): Promise<SourceFetchResult<CaseEvent>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 900, expire: 3600 });
  cacheTag("events");

  try {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: [
        "CASE_",
        "STATUS",
        "AGE",
        "SEX",
        "ONSET",
        "DEATH",
        "SOURCE",
        "LASTLOCATION",
        "TCLASS",
        "Exposure_Group",
      ].join(","),
      outSR: "4326",
      f: "geojson",
      resultRecordCount: "2000",
    });
    const res = await fetch(`${FEATURE_SERVICE}?${params.toString()}`, {
      headers: { "user-agent": UA, accept: "application/geo+json, application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`);
    const data = (await res.json()) as ArcGisFeatureCollection;
    const events: CaseEvent[] = [];
    for (const f of data.features ?? []) {
      const ev = featureToCaseEvent(f);
      if (ev) events.push(ev);
    }
    return ok(events);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[arcgis-cases] fetch failed: ${msg}`);
    return fail<CaseEvent>(err);
  }
}
