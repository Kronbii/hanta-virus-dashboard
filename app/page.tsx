import { Suspense } from "react";
import { LiveDashboard } from "@/components/live/LiveDashboard";
import { DashboardSkeleton } from "@/components/live/DashboardSkeleton";

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LiveDashboard />
    </Suspense>
  );
}
