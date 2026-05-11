import type { AnySource } from "@/lib/types";

interface SourceMeta {
  name: string;
  role: string;
  itemNoun: string;
}

/**
 * Human-readable metadata for every upstream source. Used by SourceRow
 * to render a verbose health row instead of an opaque badge.
 *
 * - name: display name shown to users
 * - role: one-line explanation of what this source feeds in the UI
 * - itemNoun: what `items` counts ("articles", "case events", …)
 */
export const SOURCE_META: Record<AnySource, SourceMeta> = {
  ARCGIS_HONDIUS: {
    name: "ArcGIS Hondius",
    role: "Drives every headline number",
    itemNoun: "case events",
  },
  WHO_DON: {
    name: "WHO Disease Outbreak News",
    role: "Audit cross-reference",
    itemNoun: "DON records",
  },
  CDC: {
    name: "CDC Hantavirus",
    role: "US baseline reference",
    itemNoun: "records",
  },
  ECDC: { name: "ECDC", role: "EU surveillance", itemNoun: "records" },
  PAHO: { name: "PAHO", role: "Americas surveillance", itemNoun: "records" },
  GDELT: { name: "GDELT 2.0", role: "News feed", itemNoun: "articles" },
  GOOGLE_NEWS: { name: "Google News", role: "News feed", itemNoun: "articles" },
};
