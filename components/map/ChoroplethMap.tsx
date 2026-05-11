"use client";

import dynamic from "next/dynamic";
import type { ChoroplethMapProps } from "./ChoroplethMap.client";

export type { ChoroplethMapProps } from "./ChoroplethMap.client";

/**
 * SSR-safe wrapper around the react-leaflet implementation. Leaflet touches
 * `window` at module load, so the actual map component is dynamically imported
 * with ssr: false and only initialized in the browser.
 */
const ChoroplethMapClient = dynamic(
  () => import("./ChoroplethMap.client").then((m) => m.ChoroplethMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full"
        style={{ background: "var(--paper)" }}
        aria-hidden
      />
    ),
  },
);

export function ChoroplethMap(props: ChoroplethMapProps) {
  return <ChoroplethMapClient {...props} />;
}
