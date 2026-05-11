import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  return (
    <header className="mx-auto max-w-6xl px-6 pt-10 pb-6 sm:px-10">
      <div className="flex items-start justify-between gap-6 border-b rule pb-6">
        <div>
          <div
            className="text-xs uppercase tracking-[0.25em]"
            style={{ color: "var(--accent)" }}
          >
            Global Health Tracker · Vol. I
          </div>
          <h1
            className="serif mt-3 text-5xl font-medium leading-[0.95] sm:text-7xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            Hantavirus
          </h1>
          <p
            className="serif mt-4 max-w-xl text-lg italic"
            style={{ color: "var(--muted)" }}
          >
            An evolving record of confirmed cases and reporting from the field
            — sourced from WHO Disease Outbreak News, the U.S. CDC, and global
            wire services.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div
        className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        <span>Sources</span>
        <span>WHO DON</span>
        <span className="opacity-50">·</span>
        <span>U.S. CDC</span>
        <span className="opacity-50">·</span>
        <span>GDELT</span>
        <span className="opacity-50">·</span>
        <span>Google News</span>
      </div>
    </header>
  );
}
