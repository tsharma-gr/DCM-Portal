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
        
        // Accurately calculate active DCMs across all 13k+ candidates
        const uniqueDCMs = new Set(chart.filter(c => c.dcm_type && c.dcm_type !== "N/A" && c.dcm_type !== "Unknown").map(c => c.dcm_type));
        statsData.activeDCMs = uniqueDCMs.size;
        
        // Calculate dynamic trends
        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(now.getMonth() - 2);

        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(now.getDate() - 14);

        const parseDate = (d: string | null | undefined) => d ? new Date(d).getTime() : 0;

        const candidatesThisMonth = chart.filter(c => parseDate(c.processed_timestamp) >= oneMonthAgo.getTime()).length;
        const candidatesLastMonth = chart.filter(c => parseDate(c.processed_timestamp) >= twoMonthsAgo.getTime() && parseDate(c.processed_timestamp) < oneMonthAgo.getTime()).length;
        const totalTrendVal = candidatesLastMonth === 0 ? 0 : Math.round(((candidatesThisMonth - candidatesLastMonth) / candidatesLastMonth) * 100);

        const fitThisWeek = chart.filter(c => c.classification === "FIT" && parseDate(c.processed_timestamp) >= oneWeekAgo.getTime()).length;
        const fitLastWeek = chart.filter(c => c.classification === "FIT" && parseDate(c.processed_timestamp) >= twoWeeksAgo.getTime() && parseDate(c.processed_timestamp) < oneWeekAgo.getTime()).length;
        const fitTrendVal = fitLastWeek === 0 ? 0 : Math.round(((fitThisWeek - fitLastWeek) / fitLastWeek) * 100);

        const unfitThisWeek = chart.filter(c => c.classification === "UNFIT" && parseDate(c.processed_timestamp) >= oneWeekAgo.getTime()).length;
        const unfitLastWeek = chart.filter(c => c.classification === "UNFIT" && parseDate(c.processed_timestamp) >= twoWeeksAgo.getTime() && parseDate(c.processed_timestamp) < oneWeekAgo.getTime()).length;
        const unfitTrendVal = unfitLastWeek === 0 ? 0 : Math.round(((unfitThisWeek - unfitLastWeek) / unfitLastWeek) * 100);

        const uniquePlatforms = new Set(chart.filter(c => c.platform_name && c.platform_name !== "N/A" && c.platform_name !== "Unknown").map(c => c.platform_name));

        statsData.trends = {
          total: `${totalTrendVal > 0 ? '+' : ''}${totalTrendVal}% from last month`,
          fit: `${fitTrendVal > 0 ? '+' : ''}${fitTrendVal}% from last week`,
          unfit: `${unfitTrendVal > 0 ? '+' : ''}${unfitTrendVal}% from last week`,
          processedToday: "Real-time updates",
          activeDCMs: `across ${uniquePlatforms.size} platform${uniquePlatforms.size !== 1 ? 's' : ''}`
        };
        
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
