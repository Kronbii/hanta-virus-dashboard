import { Suspense } from "react";
import { Header } from "@/components/dashboard/Header";
import { DataPanel } from "@/components/dashboard/DataPanel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

interface PageProps {
  searchParams: Promise<{ country?: string | string[] }>;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <main>
      <Header />
      <Suspense fallback={<DashboardSkeleton />}>
        <DataPanel searchParamsPromise={searchParams} />
      </Suspense>
    </main>
  );
}
