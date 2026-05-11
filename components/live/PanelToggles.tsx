"use client";

import { X, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useUiState } from "./UiState";

const CLOSE_BUTTON =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground focus-visible:outline-none";

export function FeedCloseButton() {
  const { setFeed } = useUiState();
  return (
    <button
      type="button"
      onClick={() => setFeed("closed")}
      aria-label="Hide case events panel"
      className={CLOSE_BUTTON}
    >
      <X className="size-4" />
    </button>
  );
}

export function PanelCloseButton() {
  const { setPanel } = useUiState();
  return (
    <button
      type="button"
      onClick={() => setPanel("closed")}
      aria-label="Hide stats panel"
      className={CLOSE_BUTTON}
    >
      <X className="size-4" />
    </button>
  );
}

const OPEN_PILL =
  "absolute z-20 inline-flex items-center gap-2 rounded-full border border-border bg-[rgba(10,18,32,0.85)] backdrop-blur-md px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-colors hover:border-brand hover:text-brand focus-visible:outline-none min-h-[40px]";

export function FeedOpenButton({ count }: { count: number }) {
  const { feed, setFeed } = useUiState();
  if (feed === "open") return null;
  const responsive = feed === "auto" ? "md:hidden" : "";
  return (
    <button
      type="button"
      onClick={() => setFeed("open")}
      aria-label="Show case events panel"
      className={`${OPEN_PILL} left-3 bottom-16 md:bottom-20 ${responsive}`}
    >
      <PanelLeftOpen className="size-3.5" />
      <span>Cases</span>
      <span className="font-mono tabular-nums text-brand">
        {count}
      </span>
    </button>
  );
}

export function PanelOpenButton({ activeCases }: { activeCases: number }) {
  const { panel, setPanel } = useUiState();
  if (panel === "open") return null;
  const responsive = panel === "auto" ? "md:hidden" : "";
  return (
    <button
      type="button"
      onClick={() => setPanel("open")}
      aria-label="Show stats panel"
      className={`${OPEN_PILL} right-3 bottom-16 md:bottom-20 ${responsive}`}
    >
      <span className="font-mono tabular-nums text-brand">
        {activeCases}
      </span>
      <span>Stats</span>
      <PanelRightOpen className="size-3.5" />
    </button>
  );
}
