export type ISO3 = string;

export type CaseSource = "WHO_DON" | "CDC" | "ECDC" | "PAHO";
export type NewsSource = "GDELT" | "GOOGLE_NEWS";
export type EventSource = "ARCGIS_HONDIUS";
export type AnySource = CaseSource | NewsSource | EventSource;

export type CaseEventStatus =
  | "CONFIRMED"
  | "PROBABLE"
  | "SUSPECTED"
  | "MONITORING"
  | "DECEASED"
  | "RECOVERED"
  | "UNKNOWN";

export interface CaseEvent {
  id: string;
  status: CaseEventStatus;
  /** [longitude, latitude] — GeoJSON order. */
  coordinates: [number, number];
  countryIso3?: ISO3;
  /** City or region label, e.g. "JOHANNESBURG". */
  location?: string;
  /** Free-text exposure group / cohort the case belongs to. */
  exposureGroup?: string;
  onset?: string; // ISO 8601
  death?: string; // ISO 8601 if deceased
  age?: number;
  /** 1 = male, 2 = female, others unknown. Following the source field shape. */
  sex?: number;
  /** Display label for the case, e.g. "Case 3" or "A". */
  caseLabel?: string;
  sourceUrl?: string;
  source: EventSource;
}

export interface CaseRecord {
  id: string; // sha1(source + iso3 + dateReported)
  countryIso3: ISO3;
  countryName: string;
  count: number;
  period: "cumulative" | "weekly" | "monthly" | "event";
  dateReported: string; // ISO 8601
  source: CaseSource;
  sourceUrl: string;
  notes?: string;
}

export interface CountryAggregate {
  iso3: ISO3;
  name: string;
  totalCases: number;
  lastUpdated: string; // ISO 8601
  sources: CaseSource[];
}

export interface NewsItem {
  id: string; // sha1(canonicalUrl)
  title: string;
  url: string;
  publisher: string;
  source: NewsSource;
  publishedAt: string; // ISO 8601
  countryIso3?: ISO3;
  excerpt?: string;
  image?: string;
  language?: string;
}

export interface SourceHealth {
  source: AnySource;
  ok: boolean;
  fetchedAt: string;
  items: number;
  error?: string;
}
