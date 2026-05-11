import type { AnySource, SourceHealth } from "@/lib/types";

interface Props {
  health: SourceHealth[];
}

const SOURCE_META: Record<AnySource, { label: string; description: string; url: string }> = {
  WHO_DON: {
    label: "WHO Disease Outbreak News",
    description: "Verified outbreak reports filtered for hantavirus.",
    url: "https://www.who.int/emergencies/disease-outbreak-news",
  },
  CDC: {
    label: "U.S. CDC surveillance",
    description: "Cumulative hantavirus cases reported in the United States since 1993.",
    url: "https://www.cdc.gov/hantavirus/data-research/cases/index.html",
  },
  ECDC: {
    label: "ECDC surveillance",
    description: "European Centre for Disease Prevention and Control.",
    url: "https://atlas.ecdc.europa.eu/public/",
  },
  PAHO: {
    label: "PAHO surveillance",
    description: "Pan American Health Organization data.",
    url: "https://www3.paho.org/data/",
  },
  GDELT: {
    label: "GDELT 2.0 DOC",
    description: "Country-tagged global news mentioning hantavirus.",
    url: "https://api.gdeltproject.org",
  },
  GOOGLE_NEWS: {
    label: "Google News",
    description: "Headline coverage from the public Google News RSS feed.",
    url: "https://news.google.com/rss/search?q=hantavirus",
  },
  ARCGIS_HONDIUS: {
    label: "ANDV Hantavirus 2026 (ArcGIS)",
    description:
      "Community-curated per-case point tracker for the MV Hondius cluster, sourced from open public-health statements.",
    url: "https://www.arcgis.com/apps/dashboards/5c68442d2afc42d7ba2696e4cd393729",
  },
};

export function SourceCitations({ health }: Props) {
  return (
    <footer
      className="border-t rule"
      style={{ color: "var(--muted)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <div
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--accent)" }}
        >
          Sources & method
        </div>
        <h2 className="serif mt-2 text-2xl font-medium" style={{ color: "var(--fg)" }}>
          Where this data comes from
        </h2>

        <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          {health.map((h) => {
            const meta = SOURCE_META[h.source];
            return (
              <div key={h.source} className="grid grid-cols-[auto_1fr] gap-3">
                <span
                  aria-hidden
                  className="mt-2 block h-2 w-2 rounded-full"
                  style={{
                    background: h.ok ? "var(--ok)" : "var(--err)",
                  }}
                />
                <div>
                  <dt className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:underline"
                      style={{ textDecorationColor: "var(--accent)" }}
                    >
                      {meta.label}
                    </a>
                  </dt>
                  <dd className="serif mt-1 text-sm italic">
                    {meta.description}
                  </dd>
                  <dd
                    className="mt-1 text-xs uppercase tracking-wider"
                    style={{ color: h.ok ? "var(--muted)" : "var(--err)" }}
                  >
                    {h.ok
                      ? `${h.items.toLocaleString()} ${h.items === 1 ? "record" : "records"}`
                      : `unavailable — ${h.error ?? "unknown error"}`}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        <p className="serif mt-8 max-w-2xl text-sm italic">
          When a source is unreachable the dashboard continues to render using
          the others. Counts are taken as point-in-time aggregates: case figures
          combine the latest reported total per country across all sources, so a
          country active in multiple feeds is not double-counted.
        </p>

        <p className="mt-6 text-xs uppercase tracking-wider">
          © {new Date().getFullYear()} · Hantavirus Tracker · independent project
        </p>
      </div>
    </footer>
  );
}
