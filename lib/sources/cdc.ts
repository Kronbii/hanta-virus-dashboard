import { cacheLife, cacheTag } from "next/cache";
import * as cheerio from "cheerio";
import { sha1 } from "@/lib/aggregator/sha1";
import { UA } from "./user-agent";
import { ok, fail, type SourceFetchResult } from "./result";
import type { CaseRecord } from "@/lib/types";

const CDC_URL = "https://www.cdc.gov/hantavirus/data-research/cases/index.html";

/**
 * The CDC page narrates US hantavirus case counts in prose. We look for the
 * top-line phrase like "890 cases of hantavirus disease were reported in the
 * United States since surveillance began in 1993." This is cumulative.
 */
function extractUsTotal(text: string): { count: number; asOf?: string } | undefined {
  const m = text.match(/([0-9][\d,]*)\s+cases?\s+of\s+hantavirus[^.]{0,180}\bUnited\s+States/i);
  if (!m) return undefined;
  const count = parseInt(m[1].replace(/,/g, ""), 10);
  if (!Number.isFinite(count) || count <= 0) return undefined;
  // Look for an "As of <date>" prefix nearby
  const dateMatch = text.match(/As of\s+([A-Z][a-z]+ \d{1,2},\s*\d{4})/);
  let asOf: string | undefined;
  if (dateMatch) {
    const d = new Date(dateMatch[1]);
    if (Number.isFinite(d.getTime())) asOf = d.toISOString();
  }
  return { count, asOf };
}

export async function fetchCdc(): Promise<SourceFetchResult<CaseRecord>> {
  "use cache";
  cacheLife({ stale: 600, revalidate: 86400, expire: 7 * 86400 });
  cacheTag("cases");

  try {
    const res = await fetch(CDC_URL, {
      headers: { "user-agent": UA, accept: "text/html" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`CDC HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header.cdc-header, .skip-to-main").remove();
    const text = $("main, body").first().text().replace(/\s+/g, " ");
    const total = extractUsTotal(text);
    if (!total) throw new Error("CDC page did not contain a recognizable US total");
    const dateReported = total.asOf ?? new Date().toISOString();
    return ok([
      {
        id: sha1(`CDC|USA|${dateReported}`),
        countryIso3: "USA",
        countryName: "United States",
        count: total.count,
        period: "cumulative",
        dateReported,
        source: "CDC",
        sourceUrl: CDC_URL,
        notes: "Cumulative HPS + non-pulmonary hantavirus cases since 1993.",
      },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[cdc] fetch failed: ${msg}`);
    return fail<CaseRecord>(err);
  }
}
