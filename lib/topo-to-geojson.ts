import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";

interface CountryProps {
  name: string;
}

/**
 * One-time conversion of the bundled world-atlas TopoJSON into a GeoJSON
 * FeatureCollection that react-leaflet can consume. Each feature's `id` is the
 * ISO 3166-1 numeric code (string) and `properties.name` is the English country
 * name — the same shape our existing helpers in `lib/iso-numeric.ts` expect.
 */
export const WORLD_GEOJSON: FeatureCollection<Polygon | MultiPolygon, CountryProps> =
  feature(
    topology as unknown as Topology,
    (topology as unknown as Topology).objects.countries as GeometryCollection<CountryProps>,
  ) as FeatureCollection<Polygon | MultiPolygon, CountryProps>;
