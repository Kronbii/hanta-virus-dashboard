"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Visibility = "auto" | "open" | "closed";

interface UiStateValue {
  feed: Visibility;
  panel: Visibility;
  setFeed: (v: Visibility) => void;
  setPanel: (v: Visibility) => void;
}

const Ctx = createContext<UiStateValue | null>(null);

/**
 * Client-side panel visibility store. Lives at the dashboard root so
 * toggling the left feed or the right stats sheet is a single React
 * state update — no router.push, no server re-render, no fetch wait.
 *
 * "auto" maps to "desktop visible / mobile hidden" via Tailwind classes
 * in each shell so the initial paint can react to viewport size without
 * a hydration mismatch.
 */
export function UiStateProvider({
  initialFeed = "closed",
  initialPanel = "auto",
  children,
}: {
  initialFeed?: Visibility;
  initialPanel?: Visibility;
  children: ReactNode;
}) {
  const [feed, setFeedState] = useState<Visibility>(initialFeed);
  const [panel, setPanelState] = useState<Visibility>(initialPanel);
  const setFeed = useCallback((v: Visibility) => setFeedState(v), []);
  const setPanel = useCallback((v: Visibility) => setPanelState(v), []);
  return (
    <Ctx.Provider value={{ feed, panel, setFeed, setPanel }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUiState(): UiStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUiState() called outside UiStateProvider");
  return v;
}
