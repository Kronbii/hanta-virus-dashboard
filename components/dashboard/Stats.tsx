import { CountUp } from "@/components/ui/CountUp";
import { relativeTime } from "@/lib/relative-time";

interface Props {
  totalCases: number;
  countries: number;
  lastUpdated: string | null;
}

export function Stats({ totalCases, countries, lastUpdated }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat
          label="Reported cases"
          valueNode={
            <CountUp
              value={totalCases}
              className="serif text-5xl font-medium tabular-nums"
            />
          }
          sublabel="cumulative, across all sources"
        />
        <Stat
          label="Countries with reports"
          valueNode={
            <CountUp
              value={countries}
              className="serif text-5xl font-medium tabular-nums"
            />
          }
          sublabel={
            countries === 0
              ? "no integrated data yet"
              : "from current integrated feeds"
          }
        />
        <Stat
          label="Last update"
          valueNode={
            <span
              className="serif text-5xl font-medium"
              style={{ letterSpacing: "-0.02em" }}
            >
              {lastUpdated ? relativeTime(lastUpdated) : "—"}
            </span>
          }
          sublabel={
            lastUpdated
              ? new Date(lastUpdated).toUTCString().replace("GMT", "UTC")
              : "awaiting first successful fetch"
          }
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  valueNode,
  sublabel,
}: {
  label: string;
  valueNode: React.ReactNode;
  sublabel: string;
}) {
  return (
    <div className="border-t rule pt-4">
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
      <div className="mt-2" style={{ letterSpacing: "-0.02em" }}>
        {valueNode}
      </div>
      <div
        className="serif mt-1 text-sm italic"
        style={{ color: "var(--muted)" }}
      >
        {sublabel}
      </div>
    </div>
  );
}
