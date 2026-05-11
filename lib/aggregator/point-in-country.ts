import type { Feature, Polygon, MultiPolygon } from "geojson";
import { WORLD_GEOJSON } from "@/lib/topo-to-geojson";
import { numericToAlpha3 } from "@/lib/iso-numeric";
import type { ISO3 } from "@/lib/types";

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

interface IndexedFeature {
  iso3: ISO3;
  bbox: BBox;
  feature: CountryFeature;
}

function ringBBox(ring: number[][]): BBox {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, minLat, maxLon, maxLat };
}

function featureBBox(geom: Polygon | MultiPolygon): BBox {
  const rings =
    geom.type === "Polygon"
      ? geom.coordinates
      : geom.coordinates.flatMap((poly) => poly);
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const ring of rings) {
    const b = ringBBox(ring);
    if (b.minLon < minLon) minLon = b.minLon;
    if (b.minLat < minLat) minLat = b.minLat;
    if (b.maxLon > maxLon) maxLon = b.maxLon;
    if (b.maxLat > maxLat) maxLat = b.maxLat;
  }
  return { minLon, minLat, maxLon, maxLat };
}

const INDEX: IndexedFeature[] = (() => {
  const out: IndexedFeature[] = [];
  for (const f of WORLD_GEOJSON.features as CountryFeature[]) {
    const iso3 = numericToAlpha3(f.id as string | number | undefined);
    if (!iso3) continue;
    out.push({ iso3, bbox: featureBBox(f.geometry), feature: f });
  }
  return out;
})();

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(
  lon: number,
  lat: number,
  geom: Polygon | MultiPolygon,
): boolean {
  if (geom.type === "Polygon") {
    if (!pointInRing(lon, lat, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (pointInRing(lon, lat, geom.coordinates[i])) return false; // hole
    }
    return true;
  }
  for (const poly of geom.coordinates) {
    if (!pointInRing(lon, lat, poly[0])) continue;
    let inHole = false;
    for (let i = 1; i < poly.length; i++) {
      if (pointInRing(lon, lat, poly[i])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

/**
 * Resolve an ISO 3166-1 alpha-3 country code from a (lon, lat) point by
 * point-in-polygon against the bundled world-atlas TopoJSON. Returns
 * undefined for points in open ocean.
 */
export function isoForCoordinates(
  lon: number,
  lat: number,
): ISO3 | undefined {
  for (const f of INDEX) {
    const { bbox } = f;
    if (lon < bbox.minLon || lon > bbox.maxLon) continue;
    if (lat < bbox.minLat || lat > bbox.maxLat) continue;
    if (pointInPolygon(lon, lat, f.feature.geometry)) return f.iso3;
  }
  return undefined;
}
