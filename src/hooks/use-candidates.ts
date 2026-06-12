import { useState, useEffect, useRef } from "react";
import { candidateService } from "@/services/candidateService";
import { Candidate, CandidateStats } from "@/types/candidate";

export function useDashboardData() {
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [chartData, setChartData] = useState<Pick<Candidate, "classification" | "platform_name" | "dcm_type" | "processed_timestamp">[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, chart, { data: recent }] = await Promise.all([
          candidateService.getDashboardStats(),
          candidateService.getChartData(),
          candidateService.getCandidates(1, 10),
        ]);
        
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

export function useCandidatesList(searchParams: Record<string, string | undefined>) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const initialLoad = useRef(true);

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
        });
        
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
  }, [searchParams.search, searchParams.classification, searchParams.dcmType, searchParams.page, searchParams.limit]);

  return { candidates, count, isLoading, isFetching };
}
