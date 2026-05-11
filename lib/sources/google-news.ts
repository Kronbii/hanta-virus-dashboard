import { cacheLife, cacheTag } from "next/cache";
import { XMLParser } from "fast-xml-parser";
import { sha1 } from "@/lib/aggregator/sha1";
import { UA } from "./user-agent";
import { ok, fail, type SourceFetchResult } from "./result";
import type { NewsItem } from "@/lib/types";

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  guid?: string | { "#text": string };
  source?: string | { "#text": string; "@_url"?: string };
  description?: string;
}

interface RssFeed {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

/**
 * Google News titles are formatted "<headline> - <publisher>". Split off the
 * trailing publisher; fall back to the <source> element when present.
 */
function splitTitle(rawTitle: string, fallback?: string): { title: string; publisher: string } {
  const idx = rawTitle.lastIndexOf(" - ");
  if (idx > 10 && idx > rawTitle.length / 3) {
    return {
      title: rawTitle.slice(0, idx).trim(),
      publisher: rawTitle.slice(idx + 3).trim() || fallback || "Unknown source",
    };
  }
  return { title: rawTitle.trim(), publisher: fallback || "Unknown source" };
}

function getSourceName(s: RssItem["source"]): string | undefined {
  if (!s) return undefined;
  if (typeof s === "string") return s;
  return s["#text"];
}

function itemToNewsItem(it: RssItem): NewsItem | null {
  const link = it.link;
  const rawTitle = it.title;
  if (!link || !rawTitle) return null;
  const fallback = getSourceName(it.source);
  const { title, publisher } = splitTitle(rawTitle, fallback);
  if (!it.pubDate) return null;
  const t = new Date(it.pubDate).getTime();
  if (!Number.isFinite(t)) return null;
  return {
    id: sha1(link),
    title,
    url: link,
    publisher,
    source: "GOOGLE_NEWS",
    publishedAt: new Date(t).toISOString(),
  };
}

export async function fetchGoogleNews(): Promise<SourceFetchResult<NewsItem>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 900, expire: 3600 });
  cacheTag("news");

  try {
    const url =
      "https://news.google.com/rss/search?q=hantavirus&hl=en-US&gl=US&ceid=US:en";
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Google News HTTP ${res.status}`);
    const xml = await res.text();
    const feed = parser.parse(xml) as RssFeed;
    const rawItems = feed.rss?.channel?.item;
    const list: RssItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
    const items: NewsItem[] = [];
    for (const raw of list) {
      const item = itemToNewsItem(raw);
      if (item) items.push(item);
    }
    return ok(items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[google-news] fetch failed: ${msg}`);
    return fail<NewsItem>(err);
  }
}
