import { relativeTime } from "@/lib/relative-time";
import { iso3ToName } from "@/lib/aggregator/country-codes";
import type { NewsItem as NewsItemT } from "@/lib/types";

interface Props {
  item: NewsItemT;
}

export function NewsItem({ item }: Props) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-4">
      <div
        className="serif text-sm italic tabular-nums"
        style={{ color: "var(--muted)", minWidth: "5rem" }}
      >
        {relativeTime(item.publishedAt)}
      </div>
      <div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="serif text-lg leading-snug hover:underline"
          style={{
            textDecorationColor: "var(--accent)",
            textUnderlineOffset: "3px",
          }}
        >
          {item.title}
        </a>
        <div
          className="mt-1 text-xs uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          {item.publisher}
          <span className="opacity-50"> · </span>
          via {item.source === "GDELT" ? "GDELT" : "Google News"}
          {item.countryIso3 && (
            <>
              <span className="opacity-50"> · </span>
              {iso3ToName(item.countryIso3)}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
