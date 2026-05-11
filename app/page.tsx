import { Suspense } from "react";
import { LiveDashboard } from "@/components/live/LiveDashboard";
import { DashboardSkeleton } from "@/components/live/DashboardSkeleton";

interface SearchParams {
  country?: string;
  q?: string;
  view?: string;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LiveDashboard searchParams={searchParams} />
    </Suspense>
  );
}
