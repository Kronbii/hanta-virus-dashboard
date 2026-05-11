interface Props {
  data: number[];
  height?: number;
  color?: string;
  peakIndex?: number;
}

export function Sparkline({
  data,
  height = 56,
  color = "#C800DF",
  peakIndex,
}: Props) {
  const max = Math.max(1, ...data);
  const w = 100;
  const stepX = data.length > 1 ? w / (data.length - 1) : w;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / max) * (height - 12) - 8;
    return [x, y, v] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${w},${height} L0,${height} Z`;

  const lastPoint = points[points.length - 1];
  const peak =
    typeof peakIndex === "number" && peakIndex >= 0 && peakIndex < points.length
      ? points[peakIndex]
      : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label="14-day case trend"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line
        x1="0"
        x2={w}
        y1={height - 0.5}
        y2={height - 0.5}
        stroke="rgba(140,170,220,0.16)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />

      <path d={areaPath} fill="url(#sparkFill)" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Peak marker */}
      {peak && peak[2] > 0 && (
        <>
          <circle
            cx={peak[0]}
            cy={peak[1]}
            r={2}
            fill="none"
            stroke={color}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={peak[0]}
            y={Math.max(8, peak[1] - 4)}
            textAnchor="middle"
            fontSize="6.5"
            fontFamily="var(--font-mono), monospace"
            fontWeight="600"
            fill={color}
          >
            {peak[2]}
          </text>
        </>
      )}

      {/* Today marker — vertical hint + dot */}
      {lastPoint && (
        <>
          <line
            x1={lastPoint[0]}
            x2={lastPoint[0]}
            y1="0"
            y2={height}
            stroke={color}
            strokeWidth="0.5"
            strokeOpacity="0.3"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r={2.2}
            fill={color}
            stroke="#0a1220"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}
