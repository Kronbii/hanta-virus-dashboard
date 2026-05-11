export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-10 sm:px-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-t rule pt-4">
            <div className="h-3 w-24 rounded-sm bg-current/10" />
            <div className="mt-3 h-12 w-32 rounded-sm bg-current/10" />
            <div className="mt-2 h-3 w-40 rounded-sm bg-current/10" />
          </div>
        ))}
      </div>

      <div className="mt-12 h-3 w-44 rounded-sm bg-current/10" />
      <div
        className="mt-3 rounded-sm"
        style={{
          background: "var(--paper)",
          aspectRatio: "16 / 9",
          minHeight: 360,
        }}
      />

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="h-3 w-32 rounded-sm bg-current/10" />
          <ul className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-12 rounded-sm bg-current/5" />
            ))}
          </ul>
        </div>
        <div>
          <div className="h-3 w-32 rounded-sm bg-current/10" />
          <ul className="mt-4 space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="h-16 rounded-sm bg-current/5" />
            ))}
          </ul>
        </div>
      </div>
      <span className="sr-only">Loading dashboard data…</span>
    </div>
  );
}
