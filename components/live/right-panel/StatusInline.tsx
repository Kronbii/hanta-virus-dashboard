import { STATUS_TINT } from "../utils";

/**
 * Inline status label with a colored dot — used in microcopy that lists
 * which statuses contribute to a KPI number.
 */
export function StatusInline({
  name,
  label,
}: {
  name: keyof typeof STATUS_TINT;
  label?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 font-semibold text-foreground/85">
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full -translate-y-px"
        style={{ background: STATUS_TINT[name] }}
      />
      {label ?? name}
    </span>
  );
}
