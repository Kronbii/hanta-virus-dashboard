"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fixed inset-0 grid place-items-center bg-background p-8 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-[rgba(10,18,32,0.78)] p-6 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#e23b3b]">
          <AlertTriangle className="size-3.5" />
          Feed interrupted
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight">
          The situation board couldn’t assemble.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          An upstream OSINT source returned an unexpected response. This is
          usually transient — retry, or return to the watch view.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            digest · {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button onClick={reset} variant="default" className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
          <Button
            render={<Link href="/" />}
            variant="outline"
            className="gap-1.5"
          >
            <Home className="size-3.5" />
            Home
          </Button>
        </div>
      </div>
    </main>
  );
}
