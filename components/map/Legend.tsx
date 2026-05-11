interface Props {
  ramp: readonly string[];
  max: number;
  label?: string;
  className?: string;
}

export function Legend({ ramp, max, label = "Cases", className }: Props) {
  const stops = ramp.length;
  const step = Math.max(1, Math.ceil(max / stops));
  return (
    <div className={`inline-flex items-center gap-2 text-xs ${className ?? ""}`}>
      <span className="uppercase tracking-wider opacity-70">{label}</span>
      <div className="flex h-3 overflow-hidden rounded-sm border border-current/20" role="presentation">
        {ramp.map((c, i) => (
          <span key={i} className="block w-6 h-full" style={{ background: c }} aria-hidden />
        ))}
      </div>
      <span className="tabular-nums opacity-70">
        1 – {max.toLocaleString()}
      </span>
      <span className="sr-only">
        Quantile color ramp with {stops} steps. Each step covers approximately {step.toLocaleString()} cases.
      </span>
    </div>
  );
}
