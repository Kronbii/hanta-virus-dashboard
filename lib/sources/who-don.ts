import { cacheLife, cacheTag } from "next/cache";
import { sha1 } from "@/lib/aggregator/sha1";
import { nameToIso3, iso3ToName } from "@/lib/aggregator/country-codes";
import { UA } from "./user-agent";
import { ok, fail, type SourceFetchResult } from "./result";
import type { CaseRecord, ISO3 } from "@/lib/types";

interface DonEntry {
  Id: string;
  Title: string;
  Overview?: string;
  Assessment?: string;
  UrlName: string;
  PublicationDate: string;
  DonId?: string;
}

interface DonResponse {
  value?: DonEntry[];
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

function plainText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "’")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCount(raw: string): number | undefined {
  const cleaned = raw.toLowerCase().replace(/,/g, "");
  if (NUMBER_WORDS[cleaned] != null) return NUMBER_WORDS[cleaned];
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

interface ParsedReport {
  total?: number;
  countries: Set<ISO3>;
  perCountry: Map<ISO3, number>;
}

/**
 * Parse a single WHO Disease Outbreak News entry for case-relevant facts.
 * Two kinds of signals:
 *  - A headline "total" figure (e.g. "a total of 8 cases").
 *  - Per-country counts (e.g. "21 cases in Argentina").
 * We also collect countries explicitly named as having cases, even when no
 * per-country count is given — they get the headline total divided across
 * them as a low-confidence estimate (capped at 1 each, since we don't really
 * know the split).
 */
function parseReport(title: string, body: string): ParsedReport {
  const text = `${title}. ${body}`;
  const out: ParsedReport = { countries: new Set(), perCountry: new Map() };

  // 1. Headline total
  const totalRe =
    /\ba\s+total\s+of\s+([0-9,]+|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty))\s+(?:confirmed\s+(?:and\s+probable\s+)?)?(?:cases|infections|patients)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = totalRe.exec(text)) !== null) {
    const v = parseCount(m[1]);
    if (v != null && (out.total == null || v > out.total)) out.total = v;
  }
  // 2. Per-country counts
  const perCountryRe =
    /([0-9][\d,]*)\s+(?:laboratory[- ]?confirmed\s+)?(?:probable\s+and\s+confirmed\s+)?(?:new\s+|additional\s+)?(?:cases|infections|patients)[^.]{0,60}?\b(?:in|from|reported\s+(?:by|in)|across)\s+([A-Z][A-Za-z'’\- ]{2,50})/g;
  while ((m = perCountryRe.exec(text)) !== null) {
    const v = parseCount(m[1]);
    if (v == null) continue;
    const candidate = m[2].trim().replace(/\.$/, "");
    const iso3 = nameToIso3(candidate);
    if (!iso3) continue;
    const prev = out.perCountry.get(iso3) ?? 0;
    if (v > prev) out.perCountry.set(iso3, v);
    out.countries.add(iso3);
  }
  // 3. Country mentions: enumerate every distinct country name in the text
  // and keep those that appear at least twice (filtering out passing
  // references like transit waypoints). For the cruise-cluster style DON
  // this captures the affected jurisdictions reasonably well.
  const mentionCounts = new Map<ISO3, number>();
  // Walk all capitalized multi-word phrases up to 4 words, test each as a name.
  const candidateRe = /\b[A-Z][A-Za-z'’\-]+(?:\s+(?:of\s+|and\s+|the\s+)?[A-Z][A-Za-z'’\-]+){0,3}\b/g;
  while ((m = candidateRe.exec(text)) !== null) {
    const candidate = m[0];
    const iso3 = nameToIso3(candidate);
    if (!iso3) continue;
    mentionCounts.set(iso3, (mentionCounts.get(iso3) ?? 0) + 1);
  }
  for (const [iso3, count] of mentionCounts) {
    // Single passing reference → skip. Two or more → include.
    if (count >= 2) out.countries.add(iso3);
  }
  return out;
}

export async function fetchWhoDon(): Promise<SourceFetchResult<CaseRecord>> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag("cases");

  try {
    const base = "https://www.who.int/api/news/diseaseoutbreaknews";
    const params = new URLSearchParams({
      "$filter":
        "contains(tolower(Title),'hantavirus') or contains(tolower(Overview),'hantavirus')",
      "$top": "30",
      "$orderby": "PublicationDate desc",
    });
    const res = await fetch(`${base}?${params.toString()}`, {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`WHO DON HTTP ${res.status}`);
    const data = (await res.json()) as DonResponse;
    const entries = data.value ?? [];

    const records: CaseRecord[] = [];
  for (const e of entries) {
    const overview = plainText(e.Overview);
    const assessment = plainText(e.Assessment);
    const report = parseReport(e.Title, `${overview} ${assessment}`);

    // Prefer per-country counts when we have them.
    if (report.perCountry.size > 0) {
      for (const [iso3, count] of report.perCountry) {
        records.push({
          id: sha1(`WHO_DON|${iso3}|${e.PublicationDate}|${e.Id}`),
          countryIso3: iso3,
          countryName: iso3ToName(iso3),
          count,
          period: "cumulative",
          dateReported: e.PublicationDate,
          source: "WHO_DON",
          sourceUrl: `https://www.who.int/emergencies/disease-outbreak-news/item/${e.UrlName}`,
          notes: e.Title,
        });
      }
      // Mention-only countries (in the same cluster) get a 1 placeholder.
      for (const iso3 of report.countries) {
        if (report.perCountry.has(iso3)) continue;
        records.push({
          id: sha1(`WHO_DON|${iso3}|${e.PublicationDate}|${e.Id}|cluster`),
          countryIso3: iso3,
          countryName: iso3ToName(iso3),
          count: 1,
          period: "event",
          dateReported: e.PublicationDate,
          source: "WHO_DON",
          sourceUrl: `https://www.who.int/emergencies/disease-outbreak-news/item/${e.UrlName}`,
          notes: e.Title,
        });
      }
      continue;
    }

    // No per-country breakdown: split the headline total evenly across the
    // listed countries, or fall back to a single event flag per country.
    const countries = Array.from(report.countries);
    if (countries.length === 0) continue;
    const perCountry =
      report.total != null
        ? Math.max(1, Math.floor(report.total / countries.length))
        : 1;
    const period = report.total != null && countries.length > 0 ? "cumulative" : "event";
    for (const iso3 of countries) {
      records.push({
        id: sha1(`WHO_DON|${iso3}|${e.PublicationDate}|${e.Id}|${period}`),
        countryIso3: iso3,
        countryName: iso3ToName(iso3),
        count: perCountry,
        period,
        dateReported: e.PublicationDate,
        source: "WHO_DON",
        sourceUrl: `https://www.who.int/emergencies/disease-outbreak-news/item/${e.UrlName}`,
        notes: e.Title,
      });
    }
  }
    return ok(records);
  } catch (err) {
    console.warn("[who-don] fetch failed:", err);
    return fail<CaseRecord>(err);
  }
}
