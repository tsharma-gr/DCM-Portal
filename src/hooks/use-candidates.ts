import { useState, useEffect, useRef } from "react";
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
        const [statsData, chart, { data: recent }] = await Promise.all([
          candidateService.getDashboardStats(),
          candidateService.getChartData(),
          candidateService.getCandidates(1, 10),
        ]);
        
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
  const [isLoading, setIsLoading] = useState(!candidatesCache[cacheKey]);
  const [isFetching, setIsFetching] = useState(false);
  const initialLoad = useRef(!candidatesCache[cacheKey]);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      setIsFetching(true);
      if (initialLoad.current) {
        setIsLoading(true);
      }
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
          initialLoad.current = false;
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [searchParams.search, searchParams.classification, searchParams.dcmType, searchParams.platform, searchParams.date, searchParams.page, searchParams.limit, cacheKey]);

  return { candidates, count, isLoading, isFetching };
}
