import Link from "next/link";
import { relativeTime } from "@/lib/relative-time";
import type { CountryAggregate } from "@/lib/types";

interface Props {
  countries: CountryAggregate[];
  selectedIso3?: string;
  limit?: number;
}

export function CountryTable({ countries, selectedIso3, limit = 10 }: Props) {
  const sorted = [...countries]
    .sort((a, b) => b.totalCases - a.totalCases)
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <p
        className="serif text-sm italic"
        style={{ color: "var(--muted)" }}
      >
        No country totals are available right now. This usually means the
        upstream sources are temporarily unreachable — the page will recover on
        the next refresh.
      </p>
    );
  }

  return (
    <ol className="mt-4 divide-y rule">
      {sorted.map((c, i) => {
        const isSelected = c.iso3 === selectedIso3;
        const filterTarget = isSelected ? "/" : `/?country=${c.iso3}`;
        return (
          <li
            key={c.iso3}
            className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 py-3"
          >
            <span
              className="serif text-2xl font-medium tabular-nums"
              style={{ color: "var(--accent)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <Link
                href={filterTarget}
                scroll={false}
                className="serif text-lg leading-tight hover:underline"
                style={{
                  textDecorationColor: "var(--accent)",
                  textUnderlineOffset: "3px",
                  color: isSelected ? "var(--accent)" : "inherit",
                  fontWeight: isSelected ? 600 : 400,
                }}
                aria-current={isSelected ? "true" : undefined}
              >
                {c.name}
              </Link>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                {c.sources.join(" · ")} · updated {relativeTime(c.lastUpdated)}
              </div>
            </div>
            <div className="serif text-2xl tabular-nums">
              {c.totalCases.toLocaleString()}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
