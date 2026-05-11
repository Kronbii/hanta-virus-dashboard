import { Suspense } from "react";
import { LiveDashboard } from "@/components/live/LiveDashboard";
import { DashboardSkeleton } from "@/components/live/DashboardSkeleton";

interface SearchParams {
  country?: string;
  q?: string;
  view?: string;
  feed?: string;
  panel?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default function Page(props: PageProps) {
  // Defer the searchParams Promise into the suspended child. Touching the
  // prop in the page body (even destructuring it) opts the static shell out
  // of partial prerendering in Next 16 cacheComponents mode.
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LiveDashboard searchParams={props.searchParams} />
    </Suspense>
  );
}
