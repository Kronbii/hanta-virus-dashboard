import { cacheLife, cacheTag } from "next/cache";
import { sha1 } from "@/lib/aggregator/sha1";
import { nameToIso3 } from "@/lib/aggregator/country-codes";
import { UA } from "./user-agent";
import { ok, fail, type SourceFetchResult } from "./result";
import type { NewsItem } from "@/lib/types";

interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string; // YYYYMMDDTHHMMSSZ
  socialimage?: string;
  domain: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

/**
 * Parses GDELT's seendate format `YYYYMMDDTHHMMSSZ` → ISO 8601.
 */
function parseSeenDate(s: string): string {
  if (!/^\d{8}T\d{6}Z$/.test(s)) return new Date().toISOString();
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
}

function articleToNewsItem(a: GdeltArticle): NewsItem | null {
  if (!a.url || !a.title) return null;
  const iso3 = nameToIso3(a.sourcecountry);
  return {
    id: sha1(a.url),
    title: a.title.trim().replace(/\s+/g, " "),
    url: a.url,
    publisher: a.domain || "Unknown source",
    source: "GDELT",
    publishedAt: parseSeenDate(a.seendate),
    countryIso3: iso3,
    language: a.language,
    image: a.socialimage || undefined,
  };
}

export async function fetchGdelt(): Promise<SourceFetchResult<NewsItem>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 900, expire: 3600 });
  cacheTag("news");

  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", "hantavirus");
    url.searchParams.set("mode", "ArtList");
    url.searchParams.set("format", "json");
    url.searchParams.set("sort", "DateDesc");
    url.searchParams.set("maxrecords", "50");
    url.searchParams.set("timespan", "30d");

    const res = await fetch(url.toString(), {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    const body = await res.text();
    if (!body.trim().startsWith("{"))
      throw new Error(`GDELT non-JSON: ${body.slice(0, 80)}`);
    const data = JSON.parse(body) as GdeltResponse;
    const items: NewsItem[] = [];
    for (const a of data.articles ?? []) {
      const item = articleToNewsItem(a);
      if (item) items.push(item);
    }
    return ok(items);
  } catch (err) {
    console.warn("[gdelt] fetch failed:", err);
    return fail<NewsItem>(err);
  }
}
