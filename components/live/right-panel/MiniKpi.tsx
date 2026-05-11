/**
 * Bento tile for a single mini KPI: a colored dot + label microcopy,
 * a big tabular number, and a one-line helper underneath.
 */
export function MiniKpi({
  value,
  label,
  helper,
  tint,
  accent,
}: {
  value: number | string;
  label: string;
  helper: string;
  tint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-white/2.5 ring-1 ring-inset ring-border px-2 py-2 min-w-0">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full shrink-0"
          style={{ background: tint }}
        />
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <div
        className={`mt-1 text-[20px] font-bold leading-none tabular-nums font-sans ${
          accent ? "text-brand" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[9.5px] font-mono text-muted-foreground/80 truncate">
        {helper}
      </div>
    </div>
  );
}
