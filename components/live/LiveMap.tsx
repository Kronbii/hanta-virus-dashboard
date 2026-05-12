"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChoroplethMap } from "@/components/map/ChoroplethMap";
import {
  BASEMAP_PRESETS,
  DEFAULT_MAP_CONFIG,
  RAMP_PRESETS,
  type MapStyleConfig,
} from "@/components/map/map-presets";
import { MapSandboxPanel } from "@/components/map/MapSandboxPanel";
import type { CaseEvent, CountryAggregate } from "@/lib/types";

interface Props {
  countries: CountryAggregate[];
  events: CaseEvent[];
  feedVisible?: boolean;
  panelVisible?: boolean;
}

export function LiveMap({ countries, events, feedVisible, panelVisible }: Props) {
  const searchParams = useSearchParams();
  const sandboxActive = searchParams?.get("sandbox") === "1";

  const [config, setConfig] = useState<MapStyleConfig>(DEFAULT_MAP_CONFIG);
  const [closed, setClosed] = useState(false);

  const basemap = BASEMAP_PRESETS[config.basemapKey] ?? BASEMAP_PRESETS["carto-dark"];
  const ramp = RAMP_PRESETS[config.rampKey];

  return (
    <div className="absolute inset-0 z-0 live-map">
      <ChoroplethMap
        className="live-map"
        data={countries}
        events={events}
        colorRamp={ramp}
        emptyColor="#0e1a2c"
        borderColor={config.borderColor}
        hoverColor={config.hoverColor}
        feedVisible={feedVisible}
        panelVisible={panelVisible}
        tileLandUrl={basemap.land}
        tileLabelsUrl={config.showLabels ? basemap.labels : null}
        tileAttribution={basemap.attribution}
        fillOpacity={config.fillOpacity}
        emptyOpacity={config.emptyOpacity}
        borderWeight={config.borderWeight}
        hoverWeight={config.hoverWeight}
        markerColors={config.markerColors}
        markerSizeScale={config.markerSizeScale}
        markerBorderColor={config.markerBorderColor}
        markerBorderWeight={config.markerBorderWeight}
        markerFillOpacity={config.markerFillOpacity}
        minZoom={config.minZoom}
        maxZoom={config.maxZoom}
        worldCopyJump={config.worldCopyJump}
        zoomAnimation={config.zoomAnimation}
        zoomControl={config.zoomControl}
        wheelDebounceTime={config.wheelDebounceTime}
      />
      {config.glowEnabled && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 70% 30%, ${config.glowColor1}, transparent 55%), radial-gradient(ellipse at 25% 70%, ${config.glowColor2}, transparent 55%)`,
          }}
        />
      )}
      {sandboxActive && !closed && (
        <MapSandboxPanel
          config={config}
          setConfig={setConfig}
          onClose={() => setClosed(true)}
        />
      )}
    </div>
  );
}
