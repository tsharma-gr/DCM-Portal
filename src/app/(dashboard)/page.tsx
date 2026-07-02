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
      <div className="relative mb-2">
        {/* Decorative Background Glows */}
        <div className="absolute top-[-80px] left-[-2%] w-[300px] h-[300px] rounded-full bg-[var(--violet)]/10 blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-[-60px] right-[10%] w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none z-0" />
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
