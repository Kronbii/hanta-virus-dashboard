"use client";

import type { ReactNode } from "react";
import { useUiState } from "./UiState";

/**
 * Client-side visibility wrapper for the left case-events panel.
 * Reads UiState.feed and applies a responsive visibility class so
 * the panel can open/close from any toggle without re-running the
 * server-rendered EventFeed inside.
 */
export function FeedShell({ children }: { children: ReactNode }) {
  const { feed } = useUiState();
  const visClass =
    feed === "open" ? "flex" : feed === "closed" ? "hidden" : "hidden md:flex";
  const containerClass = `${visClass} fixed z-30 flex-col overflow-hidden border border-border bg-[rgba(10,18,32,0.92)] md:bg-[rgba(10,18,32,0.78)] shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-md
    inset-x-2 bottom-2 top-14 max-h-[calc(100vh-3.5rem-1rem)] rounded-t-2xl rounded-b-md
    md:inset-x-auto md:left-4 md:top-16 md:bottom-14 md:max-h-none md:w-[360px] md:rounded-md`;
  return (
    <aside className={containerClass} aria-label="Case events">
      {children}
    </aside>
  );
}
