"use client";

import { X, Copy } from "lucide-react";
import type { CaseEventStatus } from "@/lib/types";
import {
  BASEMAP_PRESETS,
  RAMP_PRESETS,
  DEFAULT_MAP_CONFIG,
  type MapStyleConfig,
  type RampKey,
} from "./map-presets";

interface Props {
  config: MapStyleConfig;
  setConfig: (next: MapStyleConfig) => void;
  onClose: () => void;
}

const STATUS_KEYS: CaseEventStatus[] = [
  "CONFIRMED",
  "SUSPECTED",
  "DECEASED",
  "RECOVERED",
  "MONITORING",
  "PROBABLE",
  "UNKNOWN",
];

export function MapSandboxPanel({ config, setConfig, onClose }: Props) {
  const patch = (partial: Partial<MapStyleConfig>) =>
    setConfig({ ...config, ...partial });

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-[1400px] m-2 rounded-xl border border-border bg-[rgba(10,18,32,0.96)] backdrop-blur-md shadow-[0_-12px_48px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand">
              Sandbox · live map tweaks
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
              ?sandbox=1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyConfig}
              title="Copy JSON config to clipboard"
              className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:border-brand"
            >
              <Copy className="size-3" /> Copy JSON
            </button>
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_MAP_CONFIG)}
              className="rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:border-brand"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sandbox"
              className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground hover:border-brand"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3 max-h-[40vh] overflow-y-auto">
          {/* ── Basemap ───────────────────────────────────────── */}
          <Section title="Basemap">
            <Field label="Tile style">
              <select
                value={config.basemapKey}
                onChange={(e) => patch({ basemapKey: e.target.value })}
                className="sandbox-input"
              >
                {Object.entries(BASEMAP_PRESETS).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              label="Show labels"
              checked={config.showLabels}
              onChange={(v) => patch({ showLabels: v })}
            />
          </Section>

          {/* ── Choropleth ────────────────────────────────────── */}
          <Section title="Choropleth (countries)">
            <Field label="Color ramp">
              <select
                value={config.rampKey}
                onChange={(e) =>
                  patch({ rampKey: e.target.value as RampKey })
                }
                className="sandbox-input"
              >
                {Object.keys(RAMP_PRESETS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <RampStrip ramp={RAMP_PRESETS[config.rampKey]} />
            </Field>
            <Slider
              label="Fill opacity"
              min={0}
              max={1}
              step={0.05}
              value={config.fillOpacity}
              onChange={(v) => patch({ fillOpacity: v })}
            />
            <Slider
              label="Empty (no-data) opacity"
              min={0}
              max={1}
              step={0.05}
              value={config.emptyOpacity}
              onChange={(v) => patch({ emptyOpacity: v })}
            />
          </Section>

          {/* ── Borders ──────────────────────────────────────── */}
          <Section title="Borders & hover">
            <ColorField
              label="Border color"
              value={config.borderColor}
              onChange={(v) => patch({ borderColor: v })}
            />
            <Slider
              label="Border weight"
              min={0}
              max={3}
              step={0.1}
              value={config.borderWeight}
              onChange={(v) => patch({ borderWeight: v })}
            />
            <ColorField
              label="Highlight color"
              value={config.hoverColor}
              onChange={(v) => patch({ hoverColor: v })}
            />
            <Slider
              label="Highlight weight"
              min={0}
              max={5}
              step={0.1}
              value={config.hoverWeight}
              onChange={(v) => patch({ hoverWeight: v })}
            />
          </Section>

          {/* ── Markers ──────────────────────────────────────── */}
          <Section title="Case markers">
            <Slider
              label={`Size scale (×${config.markerSizeScale.toFixed(2)})`}
              min={0.4}
              max={2.5}
              step={0.05}
              value={config.markerSizeScale}
              onChange={(v) => patch({ markerSizeScale: v })}
            />
            <Slider
              label="Marker fill opacity"
              min={0}
              max={1}
              step={0.05}
              value={config.markerFillOpacity}
              onChange={(v) => patch({ markerFillOpacity: v })}
            />
            <ColorField
              label="Marker border"
              value={config.markerBorderColor}
              onChange={(v) => patch({ markerBorderColor: v })}
            />
            <Slider
              label="Marker border weight"
              min={0}
              max={4}
              step={0.1}
              value={config.markerBorderWeight}
              onChange={(v) => patch({ markerBorderWeight: v })}
            />
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                Status colors
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_KEYS.map((s) => (
                  <ColorField
                    key={s}
                    label={s}
                    compact
                    value={config.markerColors[s]}
                    onChange={(v) =>
                      patch({
                        markerColors: { ...config.markerColors, [s]: v },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* ── Zoom + interaction ───────────────────────────── */}
          <Section title="Zoom & interaction">
            <Slider
              label={`Min zoom (${config.minZoom})`}
              min={0}
              max={6}
              step={1}
              value={config.minZoom}
              onChange={(v) => patch({ minZoom: v })}
            />
            <Slider
              label={`Max zoom (${config.maxZoom})`}
              min={4}
              max={18}
              step={1}
              value={config.maxZoom}
              onChange={(v) => patch({ maxZoom: v })}
            />
            <Slider
              label={`Wheel debounce (${config.wheelDebounceTime}ms)`}
              min={0}
              max={300}
              step={10}
              value={config.wheelDebounceTime}
              onChange={(v) => patch({ wheelDebounceTime: v })}
            />
            <Toggle
              label="World wrap"
              checked={config.worldCopyJump}
              onChange={(v) => patch({ worldCopyJump: v })}
            />
            <Toggle
              label="Zoom animation"
              checked={config.zoomAnimation}
              onChange={(v) => patch({ zoomAnimation: v })}
            />
            <Toggle
              label="Show zoom controls"
              checked={config.zoomControl}
              onChange={(v) => patch({ zoomControl: v })}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-black/20 p-2.5 space-y-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/90">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sandbox-range"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={hexFor(value)}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer rounded border border-border bg-transparent p-0"
        />
        {!compact && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sandbox-input flex-1 font-mono text-[10px]"
          />
        )}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-(--brand)"
      />
    </label>
  );
}

function RampStrip({ ramp }: { ramp: string[] }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded">
      {ramp.map((c, i) => (
        <div key={i} style={{ background: c }} className="flex-1" />
      ))}
    </div>
  );
}

// rgba(...) values can't go into <input type="color">. Strip to hex if needed.
function hexFor(v: string): string {
  if (v.startsWith("#")) return v.length === 7 ? v : "#000000";
  return "#000000";
}
