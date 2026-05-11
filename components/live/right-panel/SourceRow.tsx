import type { SourceHealth } from "@/lib/types";
import { timeAgo } from "../utils";
import { SOURCE_META } from "./source-meta";

/**
 * Verbose source-health row. Replaces the previous opaque pill format —
 * shows source name, role in the pipeline, last fetch count + noun,
 * relative fetch age, and (when present) the failure message.
 */
export function SourceRow({
  health,
  now,
}: {
  health: SourceHealth;
  now: number;
}) {
  const meta = SOURCE_META[health.source] ?? {
    name: health.source,
    role: "",
    itemNoun: "items",
  };
  const empty = health.ok && health.items === 0;
  const dotColor = !health.ok
    ? "var(--hot)"
    : empty
      ? "var(--warn)"
      : "var(--ok)";
  const stateLabel = !health.ok
    ? "Failing"
    : empty
      ? "Empty fetch"
      : "Healthy";
  const stateColor = !health.ok
    ? "text-hot"
    : empty
      ? "text-warn"
      : "text-ok";

  return (
    <li className="rounded-md ring-1 ring-inset ring-border bg-white/2 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full shrink-0"
            style={{ background: dotColor }}
          />
          <span className="text-[13px] font-semibold text-foreground truncate">
            {meta.name}
          </span>
        </div>
        <span
          className={`text-[10px] uppercase tracking-[0.14em] font-mono font-semibold shrink-0 ${stateColor}`}
        >
          {stateLabel}
        </span>
      </div>
      <div className="mt-1 text-[11.5px] text-muted-foreground truncate">
        {meta.role}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2 text-[11px] font-mono">
        <span className="text-foreground/90">
          <span className="text-foreground font-semibold tabular-nums">
            {health.items}
          </span>{" "}
          <span className="text-muted-foreground">{meta.itemNoun}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {timeAgo(health.fetchedAt, now)} ago
        </span>
      </div>
      {health.error && (
        <div className="mt-1 text-[11px] font-mono text-(--hot)/90 truncate">
          ↳ {health.error}
        </div>
      )}
    </li>
  );
}
