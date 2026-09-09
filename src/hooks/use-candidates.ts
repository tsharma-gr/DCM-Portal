/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { candidateService } from "@/services/candidateService";
import { Candidate, CandidateStats } from "@/types/candidate";

// Simple global cache for dashboard to prevent UI collapse
let dashboardCache: { stats: CandidateStats; chartData: Pick<Candidate, "classification" | "platform_name" | "dcm_type" | "processed_timestamp">[]; recentCandidates: Candidate[] } | null = null;

export function useDashboardData() {
  const [stats, setStats] = useState<CandidateStats | null>(dashboardCache?.stats || null);
  const [chartData, setChartData] = useState<Pick<Candidate, "classification" | "platform_name" | "dcm_type" | "processed_timestamp">[]>(dashboardCache?.chartData || []);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>(dashboardCache?.recentCandidates || []);
  const [isLoading, setIsLoading] = useState(!dashboardCache);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (!dashboardCache) {
        setIsLoading(true);
      }
      try {
        const [summary, { data: recent }] = await Promise.all([
          candidateService.getDashboardSummary(),
          candidateService.getCandidates(1, 10),
        ]);
        
        const statsData = summary.totals;
        const chart = summary.chartData;

        // If trends were not computed by RPC (fallback case), compute fallback trend strings safely
        if (!statsData.trends) {
          const uniqueDCMs = new Set(chart.filter((c: any) => c.dcm_type && c.dcm_type !== "N/A" && c.dcm_type !== "Unknown").map((c: any) => c.dcm_type));
          statsData.activeDCMs = uniqueDCMs.size;
          const uniquePlatforms = new Set(chart.filter((c: any) => c.platform_name && c.platform_name !== "N/A" && c.platform_name !== "Unknown").map((c: any) => c.platform_name));

          statsData.trends = {
            total: "Up to date",
            fit: "Up to date",
            unfit: "Up to date",
            processedToday: "Real-time updates",
            activeDCMs: `across ${uniquePlatforms.size} platform${uniquePlatforms.size !== 1 ? 's' : ''}`
          };
        }
        
        dashboardCache = { stats: statsData, chartData: chart, recentCandidates: recent };

        if (mounted) {
          setStats(statsData);
          setChartData(chart);
          setRecentCandidates(recent);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  return { stats, chartData, recentCandidates, isLoading };
}

// Simple global cache to prevent UI collapse on router.back() scroll restoration
const candidatesCache: Record<string, { data: Candidate[]; count: number }> = {};

export function useCandidatesList(searchParams: Record<string, string | undefined>) {
  const cacheKey = JSON.stringify(searchParams);
  
  const [candidates, setCandidates] = useState<Candidate[]>(candidatesCache[cacheKey]?.data || []);
  const [count, setCount] = useState(candidatesCache[cacheKey]?.count || 0);
  const [isLoading, setIsLoading] = useState(!candidatesCache[cacheKey] && Object.keys(candidatesCache).length === 0);
  const [isFetching, setIsFetching] = useState(!candidatesCache[cacheKey]);

  useEffect(() => {
    let mounted = true;
    
    // If we have cached data for this exact query, set it immediately
    if (candidatesCache[cacheKey]) {
      setCandidates(candidatesCache[cacheKey].data);
      setCount(candidatesCache[cacheKey].count);
      setIsLoading(false);
      setIsFetching(false);
    } else {
      setIsFetching(true);
    }

    const fetchData = async () => {
      try {
        const page = Number(searchParams.page) || 1;
        const limit = Number(searchParams.limit) || 10;
        
        const { data, count: totalCount } = await candidateService.getCandidates(page, limit, {
          search: searchParams.search,
          classification: searchParams.classification,
          dcmType: searchParams.dcmType,
          platform: searchParams.platform,
          date: searchParams.date,
        });
        
        candidatesCache[cacheKey] = { data, count: totalCount };

        if (mounted) {
          setCandidates(data);
          setCount(totalCount);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [searchParams.search, searchParams.classification, searchParams.dcmType, searchParams.platform, searchParams.date, searchParams.page, searchParams.limit, cacheKey]);

  return { candidates, count, isLoading, isFetching };
}
