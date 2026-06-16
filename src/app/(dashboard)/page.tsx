"use client";

import { useDashboardData } from "@/hooks/use-candidates";
import { StatCards } from "@/components/dashboard/stat-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { RecentCandidates } from "@/components/dashboard/recent-candidates";
import DashboardLoading from "./loading";
import { Suspense } from "react";

function DashboardContent() {
  const { stats, chartData, recentCandidates, isLoading } = useDashboardData();

  if (isLoading || !stats) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your AI recruitment pipeline and candidate metrics.
        </p>
      </div>

      <StatCards stats={stats} />
      <DashboardCharts data={chartData} />
      <RecentCandidates candidates={recentCandidates} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
