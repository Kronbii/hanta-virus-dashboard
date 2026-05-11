"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Activity, Map } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LiveClock } from "./LiveClock";

interface Props {
  trackedCount: number;
  view: string;
  query: string;
}

const DEBOUNCE_MS = 250;

export function TopBar({ trackedCount, view, query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [draftQuery, setDraftQuery] = useState(query);

  // Keep local input in sync when the URL changes externally (e.g. back/forward).
  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  // Debounce typing → URL.
  useEffect(() => {
    if (draftQuery === query) return;
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (draftQuery) params.set("q", draftQuery);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [draftQuery, query, pathname, router, searchParams]);

  const setView = (next: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "live") params.delete("view");
    else params.set("view", next);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-4 border-b border-border bg-gradient-to-b from-[#080e1a]/95 to-[#080e1a]/70 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] uppercase">
        <span className="relative inline-flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e23b3b] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e23b3b]" />
        </span>
        <span>Hantawatch</span>
        <span className="ml-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
          OSINT · v0.4-rc
        </span>
      </div>

      <Separator orientation="vertical" className="!h-5" />

      <Tabs value={view} onValueChange={(v) => setView(String(v))}>
        <TabsList className="h-7 bg-transparent p-0 gap-0.5">
          <TabsTrigger
            value="live"
            className="h-7 px-2.5 text-[11px] uppercase tracking-[0.1em] gap-1.5 data-[state=active]:bg-white/5 data-[state=active]:text-foreground rounded-[3px]"
          >
            <Activity className="size-3" /> Live
          </TabsTrigger>
          <TabsTrigger
            value="cases"
            className="h-7 px-2.5 text-[11px] uppercase tracking-[0.1em] gap-1.5 data-[state=active]:bg-white/5 data-[state=active]:text-foreground rounded-[3px]"
          >
            <Map className="size-3" /> Cases
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative flex-1 max-w-[380px]">
        <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draftQuery}
          onChange={(e) => setDraftQuery(e.target.value)}
          placeholder="Filter region, exposure group, case label…"
          aria-label="Filter case events"
          className="h-7 pl-7 text-xs bg-white/[0.04] border-border placeholder:text-muted-foreground/80"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-[#4ade80] animate-pulse" />
        <span>
          Live · <span className="tabular-nums text-foreground">{trackedCount}</span> tracked
        </span>
        <LiveClock />
      </div>
    </header>
  );
}
