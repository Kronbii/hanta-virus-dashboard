import type { NewsItem } from "@/lib/types";
import { Marquee } from "@/components/ui/marquee";
import { Badge } from "@/components/ui/badge";

interface Props {
  items: NewsItem[];
}

const SOURCE_LABEL: Record<string, string> = {
  GDELT: "GDELT",
  GOOGLE_NEWS: "Google News",
};

export function NewsTicker({ items }: Props) {
  const visible = items.slice(0, 24);

  return (
    <footer className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center border-t border-border bg-[rgba(8,14,26,0.85)] backdrop-blur">
      <div className="flex shrink-0 items-center gap-2 px-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-r border-border h-full">
        <span className="size-1.5 rounded-full bg-[#e23b3b] animate-pulse" />
        News ticker
      </div>
      <div
        className="relative flex-1 overflow-hidden h-full
          [mask-image:linear-gradient(to_right,transparent_0,#000_64px,#000_calc(100%-64px),transparent_100%)]
          [-webkit-mask-image:linear-gradient(to_right,transparent_0,#000_64px,#000_calc(100%-64px),transparent_100%)]"
      >
        {visible.length === 0 ? (
          <div className="flex h-full items-center px-4 text-xs text-muted-foreground">
            Awaiting feed from GDELT and Google News…
          </div>
        ) : (
          <Marquee className="h-full p-0 [--duration:120s] [--gap:2.5rem]" pauseOnHover>
            {visible.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-full items-center gap-3 whitespace-nowrap text-[11px] hover:text-brand transition-colors"
              >
                <Badge
                  variant="outline"
                  className="rounded-[2px] border-border bg-white/[0.04] px-1.5 py-0 text-[9px] uppercase tracking-[0.12em] text-foreground font-normal"
                >
                  {SOURCE_LABEL[n.source] ?? n.source}
                </Badge>
                <span className="text-muted-foreground tabular-nums tracking-[0.04em]">
                  {n.publisher}
                </span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-foreground">{n.title}</span>
              </a>
            ))}
          </Marquee>
        )}
      </div>
    </footer>
  );
}
