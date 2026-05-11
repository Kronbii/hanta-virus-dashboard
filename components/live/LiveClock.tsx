"use client";

import { useEffect, useState } from "react";

function format(d: Date) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())}Z`;
}

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--fg)" }}>
      {now ? format(now) : "—:—:—"}
    </span>
  );
}
