"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <main className="mx-auto max-w-2xl px-6 py-24 sm:px-10">
      <div
        className="text-xs uppercase tracking-[0.25em]"
        style={{ color: "var(--accent)" }}
      >
        Something went wrong
      </div>
      <h1
        className="serif mt-3 text-4xl font-medium leading-tight sm:text-5xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        We couldn’t assemble the report.
      </h1>
      <p
        className="serif mt-4 text-lg italic"
        style={{ color: "var(--muted)" }}
      >
        The dashboard hit an unexpected error while talking to its upstream
        sources. This is usually transient — try again in a moment, or return
        to the home view.
      </p>
      {error.digest && (
        <p
          className="mt-4 text-xs uppercase tracking-wider"
          style={{ color: "var(--muted)" }}
        >
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4 text-sm uppercase tracking-wider">
        <button
          onClick={reset}
          className="rounded-sm border px-4 py-2 hover:bg-[var(--accent-soft)]"
          style={{ borderColor: "var(--rule)", color: "var(--accent)" }}
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-sm border px-4 py-2 hover:bg-[var(--accent-soft)]"
          style={{ borderColor: "var(--rule)", color: "var(--fg)" }}
        >
          Home
        </Link>
      </div>
    </main>
  );
}
