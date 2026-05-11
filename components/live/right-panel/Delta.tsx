"use client";

import { TrendingUp, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Compact +N / window pill rendered next to a KPI hero number.
 * Pink (brand-2) when value > 0, neutral grey otherwise.
 */
export function Delta({
  value,
  window,
  noun,
}: {
  value: number;
  window: string;
  noun: string;
}) {
  const trend = value > 0 ? "up" : "flat";
  const color = trend === "up" ? "text-brand-2" : "text-muted-foreground";
  const Icon = trend === "up" ? TrendingUp : Minus;
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`${value} ${noun} in last ${window}`}
        className={`flex items-center gap-1 text-[10px] font-mono tabular-nums ${color}`}
      >
        <Icon className="size-3" />
        {value > 0 ? `+${value}` : "0"} · {window}
      </TooltipTrigger>
      <TooltipContent className="text-[11px]">
        {value} {noun} in last {window}
      </TooltipContent>
    </Tooltip>
  );
}
