"use client";

import { STATUS_TINT } from "./utils";
import { useUiState } from "./UiState";

interface Props {
  totalCases: number;
  deaths: number;
  deathRate: number;
}

function formatPct(x: number): string {
  if (!Number.isFinite(x) || x <= 0) return "0%";
  const pct = x * 100;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(0)}%`;
}

/**
 * Mobile-only stat strip floating just under the TopBar. Surfaces the three
 * headline numbers (cases / deaths / fatality rate) so a user landing on the
 * dashboard sees the situation at a glance — without having to open the
 * full stats sheet.
 */
export function MobileStatsHud({ totalCases, deaths, deathRate }: Props) {
  return (
    <div
      role="region"
      aria-label="Outbreak headline numbers"
      className="md:hidden fixed left-3 right-3 top-14 z-20 flex items-stretch overflow-hidden rounded-2xl border border-border bg-[rgba(10,18,32,0.78)] backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
    >
      <Cell label="Cases" value={totalCases} accent />
      <Divider />
      <Cell label="Deaths" value={deaths} dot={STATUS_TINT.DECEASED} />
      <Divider />
      <Cell label="Rate" value={formatPct(deathRate)} accent />
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
  dot,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  dot?: string;
}) {
  return (
    <div className="flex-1 px-3 py-2 min-w-0">
      <div className="flex items-center gap-1.5">
        {dot && (
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ background: dot }}
          />
        )}
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={`mt-0.5 text-[22px] font-extrabold leading-none tabular-nums font-sans ${
          accent ? "text-[color:var(--brand)]" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <span aria-hidden className="w-px self-stretch bg-border" />
  );
}
