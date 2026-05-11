import type { CaseEvent, CaseEventStatus } from "@/lib/types";

const STATUS_COLOR: Record<CaseEventStatus, string> = {
  DECEASED: "#7A2F1C",
  CONFIRMED: "#E63946",
  PROBABLE: "#D17557",
  SUSPECTED: "#D9A155",
  MONITORING: "#C9B89E",
  RECOVERED: "#5C8A3F",
  UNKNOWN: "#6B5F55",
};

const STATUS_ORDER: CaseEventStatus[] = [
  "DECEASED",
  "CONFIRMED",
  "PROBABLE",
  "SUSPECTED",
  "MONITORING",
  "RECOVERED",
  "UNKNOWN",
];

const STATUS_LABEL: Record<CaseEventStatus, string> = {
  DECEASED: "Deceased",
  CONFIRMED: "Confirmed",
  PROBABLE: "Probable",
  SUSPECTED: "Suspected",
  MONITORING: "Monitoring",
  RECOVERED: "Recovered",
  UNKNOWN: "Unknown",
};

interface Props {
  events: CaseEvent[];
}

export function StatusLegend({ events }: Props) {
  if (events.length === 0) return null;
  const counts = new Map<CaseEventStatus, number>();
  for (const e of events) counts.set(e.status, (counts.get(e.status) ?? 0) + 1);

  const rows = STATUS_ORDER.filter((s) => (counts.get(s) ?? 0) > 0);
  if (rows.length === 0) return null;

  return (
    <div
      className="status-legend"
      role="img"
      aria-label="Case status legend with counts"
    >
      <div className="status-legend-title">MV Hondius cluster · by status</div>
      <ul>
        {rows.map((s) => (
          <li key={s}>
            <span
              aria-hidden
              className="swatch"
              style={{ background: STATUS_COLOR[s] }}
            />
            <span>{STATUS_LABEL[s]}</span>
            <span className="count">{(counts.get(s) ?? 0).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
