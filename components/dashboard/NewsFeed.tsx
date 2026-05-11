import Link from "next/link";
import { NewsItem } from "./NewsItem";
import { iso3ToName } from "@/lib/aggregator/country-codes";
import type { NewsItem as NewsItemT } from "@/lib/types";

interface Props {
  items: NewsItemT[];
  filterIso3?: string;
  limit?: number;
}

export function NewsFeed({ items, filterIso3, limit = 30 }: Props) {
  const shown = items.slice(0, limit);

  return (
    <div>
      {filterIso3 && (
        <div
          className="mb-4 flex items-baseline justify-between rounded-sm px-4 py-3"
          style={{
            background: "var(--accent-soft)",
            color: "var(--fg)",
          }}
        >
          <span className="text-sm">
            Showing news tagged{" "}
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {iso3ToName(filterIso3)}
            </span>
            .
          </span>
          <Link
            href="/"
            scroll={false}
            className="text-xs uppercase tracking-wider hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Clear filter
          </Link>
        </div>
      )}

      {shown.length === 0 ? (
        <p
          className="serif text-sm italic"
          style={{ color: "var(--muted)" }}
        >
          No matching reports right now.
          {filterIso3
            ? " Try clearing the country filter, or check back shortly."
            : " The wire is quiet — both upstream news sources returned empty."}
        </p>
      ) : (
        <ul className="space-y-6">
          {shown.map((n) => (
            <NewsItem key={n.id} item={n} />
          ))}
        </ul>
      )}

      {items.length > shown.length && (
        <p
          className="mt-6 text-xs uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Showing {shown.length} of {items.length} reports.
        </p>
      )}
    </div>
  );
}
