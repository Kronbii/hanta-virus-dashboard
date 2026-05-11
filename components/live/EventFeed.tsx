import { Skull, AlertTriangle, HelpCircle, Eye, CircleCheck, Activity, ExternalLink } from "lucide-react";
import { iso3ToName } from "@/lib/aggregator/country-codes";
import type { CaseEvent, CaseEventStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { STATUS_TINT, STATUS_INK, STATUS_LABEL, timeAgo, eventHeadline } from "./utils";

interface Props {
  events: CaseEvent[];
  totalCases: number;
  now: number;
}

const StatusIcon: Record<CaseEventStatus, React.ComponentType<{ className?: string }>> = {
  DECEASED: Skull,
  CONFIRMED: AlertTriangle,
  PROBABLE: HelpCircle,
  SUSPECTED: Eye,
  MONITORING: Activity,
  RECOVERED: CircleCheck,
  UNKNOWN: HelpCircle,
};

export function EventFeed({ events, totalCases, now }: Props) {
  return (
    <aside
      className="absolute left-4 top-16 bottom-14 z-10 flex w-[360px] flex-col overflow-hidden rounded-md border border-border bg-[rgba(10,18,32,0.78)] shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
      aria-label="Case events"
    >
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-border text-[11px] uppercase tracking-[0.14em]">
        <span className="font-medium">Case events</span>
        <span className="text-[10px] tracking-[0.08em] tabular-nums text-muted-foreground">
          {events.length} active · {totalCases.toLocaleString()} cumulative
        </span>
      </header>

      <ScrollArea className="flex-1">
        {events.length === 0 ? (
          <div className="px-4 py-6 text-xs leading-relaxed text-muted-foreground">
            No matching case events. Clear the filter to see the live ArcGIS Hondius feed.
          </div>
        ) : (
          events.map((ev, i) => {
            const Icon = StatusIcon[ev.status];
            const tint = STATUS_TINT[ev.status];
            const ink = STATUS_INK[ev.status];
            const Row = ev.sourceUrl ? "a" : "div";
            const rowProps = ev.sourceUrl
              ? {
                  href: ev.sourceUrl,
                  target: "_blank" as const,
                  rel: "noreferrer noopener",
                }
              : {};
            return (
              <article key={ev.id}>
                <Row
                  {...rowProps}
                  className="grid grid-cols-[28px_1fr] gap-2.5 px-3.5 py-3 transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.05] focus-visible:outline-none cursor-pointer"
                >
                  <div className="flex justify-center pt-0.5">
                    <span
                      className="grid size-6 place-items-center rounded-full border border-black/40"
                      style={{ background: tint, color: ink }}
                    >
                      <Icon className="size-3" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <Badge
                        className="rounded-[2px] px-1.5 py-px text-[9px] font-bold tracking-[0.14em] border-transparent"
                        style={{ background: tint, color: ink }}
                      >
                        {STATUS_LABEL[ev.status]}
                      </Badge>
                      {ev.countryIso3 && (
                        <span className="truncate tracking-[0.08em]">
                          {iso3ToName(ev.countryIso3)}
                        </span>
                      )}
                      {ev.sourceUrl && (
                        <ExternalLink
                          className="ml-auto size-3 shrink-0 text-muted-foreground/70"
                          aria-hidden
                        />
                      )}
                    </div>
                    <h4 className="mt-1 text-[13px] font-medium leading-snug text-foreground">
                      {eventHeadline(ev)}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="rounded-[2px] px-1.5 py-0 text-[9px] font-normal uppercase tracking-[0.12em] border-border text-foreground">
                        ARCGIS
                      </Badge>
                      {ev.exposureGroup && (
                        <span className="italic truncate">{ev.exposureGroup}</span>
                      )}
                      <span className="ml-auto tracking-[0.04em] tabular-nums">
                        {timeAgo(ev.onset ?? ev.death, now)} ago
                      </span>
                    </div>
                  </div>
                </Row>
                {i < events.length - 1 && <Separator className="opacity-50" />}
              </article>
            );
          })
        )}
      </ScrollArea>
    </aside>
  );
}
