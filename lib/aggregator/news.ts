import { fetchGdelt } from "@/lib/sources/gdelt";
import { fetchGoogleNews } from "@/lib/sources/google-news";
import type { NewsItem, NewsSource, SourceHealth } from "@/lib/types";
import type { SourceFetchResult } from "@/lib/sources/result";

export interface NewsResult {
  items: NewsItem[];
  health: SourceHealth[];
}

interface SourceSpec {
  name: NewsSource;
  fetch: () => Promise<SourceFetchResult<NewsItem>>;
}

const SOURCES: SourceSpec[] = [
  { name: "GDELT", fetch: fetchGdelt },
  { name: "GOOGLE_NEWS", fetch: fetchGoogleNews },
];

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const byId = new Map<string, NewsItem>();
  for (const it of items) {
    if (!byId.has(it.id)) byId.set(it.id, it);
  }
  const byTitle = new Map<string, NewsItem>();
  for (const it of byId.values()) {
    const key = normalizeTitle(it.title);
    if (!key) continue;
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, it);
      continue;
    }
    if (!existing.countryIso3 && it.countryIso3) byTitle.set(key, it);
  }
  return Array.from(byTitle.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function aggregateNews(filterIso3?: string): Promise<NewsResult> {
  const results = await Promise.all(
    SOURCES.map(async (s) => ({ name: s.name, result: await s.fetch() })),
  );
  const merged = dedupe(results.flatMap((r) => r.result.items));
  const filtered = filterIso3
    ? merged.filter((i) => i.countryIso3 === filterIso3)
    : merged;
  return {
    items: filtered,
    health: results.map(({ name, result }) => ({
      source: name,
      ok: result.ok,
      fetchedAt: result.fetchedAt,
      items: result.items.length,
      error: result.error,
    })),
  };
}
