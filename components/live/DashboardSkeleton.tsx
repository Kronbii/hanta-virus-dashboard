import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-4 border-b border-border bg-[#080e1a]/95 px-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-7 max-w-[380px] flex-1" />
        <Skeleton className="ml-auto h-4 w-36" />
      </div>

      {/* map area placeholder */}
      <div className="absolute inset-0 z-0 bg-[#0e1a2c]" />

      {/* left feed */}
      <div className="absolute left-4 top-16 bottom-14 z-10 flex w-[360px] flex-col gap-3 rounded-md border border-border bg-[rgba(10,18,32,0.78)] p-4 backdrop-blur-md">
        <Skeleton className="h-4 w-2/3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-[28px_1fr] gap-2.5 py-2">
            <Skeleton className="size-6 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* right panel */}
      <div className="absolute right-4 top-16 bottom-14 z-10 flex w-[320px] flex-col gap-3">
        <div className="rounded-xl border border-border bg-[rgba(10,18,32,0.78)] p-3.5 backdrop-blur-md">
          <Skeleton className="mb-3 h-3 w-28" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-baseline justify-between py-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-xl border border-border bg-[rgba(10,18,32,0.78)] p-3.5 backdrop-blur-md">
          <Skeleton className="mb-3 h-3 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      {/* ticker */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-3 border-t border-border bg-[rgba(8,14,26,0.85)] px-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 flex-1" />
      </div>
    </main>
  );
}
