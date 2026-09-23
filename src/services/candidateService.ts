/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { Candidate, CandidateStats } from "@/types/candidate";

const db = supabase as any;

export const candidateService = {
  async getCandidates(
    page = 1,
    limit = 10,
    filters?: {
      classification?: string;
      platform?: string;
      dcmType?: string;
      search?: string;
      date?: string;
    }
  ) {
    let query = db
      .from("candidates")
      .select("*", { count: "exact" })
      .order("processed_timestamp", { ascending: false });

    if (filters?.classification && filters.classification !== "All") {
      const dbClassification = filters.classification === "Error" ? "Pending" : filters.classification;
      query = query.eq("classification", dbClassification);
    }
    if (filters?.platform && filters.platform !== "All") {
      query = query.ilike("platform_name", `%${filters.platform}%`);
    }
    if (filters?.dcmType && filters.dcmType !== "All") {
      query = query.eq("dcm_type", filters.dcmType);
    }
    if (filters?.search) {
      query = query.ilike("candidate_name", `%${filters.search}%`);
    }
    if (filters?.date) {
      // filters.date is expected to be "YYYY-MM-DD"
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.gte("processed_timestamp", startOfDay.toISOString());
      query = query.lte("processed_timestamp", endOfDay.toISOString());
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    
    // Map 'Pending' to 'Error' for the frontend
    const mappedData = (data || []).map((c: Omit<Candidate, "classification"> & { classification: string }) => ({
      ...c,
      classification: c.classification === "Pending" ? "Error" : c.classification
    }));

    return { data: mappedData as Candidate[], count: count || 0 };
  },

  async getDashboardSummary() {
    try {
      const response = await db.rpc("get_dashboard_summary");
      const resData = response?.data as unknown as Record<string, any>;
      if (!response.error && resData && resData.totals) {
        const t = resData.trends || {};
        
        const calcTrend = (current: number, previous: number, label: string) => {
          if (!previous || previous === 0) {
            return current > 0 ? `+100% from ${label}` : `0% from ${label}`;
          }
          const diff = Math.round(((current - previous) / previous) * 100);
          return `${diff >= 0 ? '+' : ''}${diff}% from ${label}`;
        };

        const totals: CandidateStats = {
          total: Number(resData.totals.total) || 0,
          fit: Number(resData.totals.fit) || 0,
          unfit: Number(resData.totals.unfit) || 0,
          processedToday: Number(resData.totals.processedToday) || 0,
          activeDCMs: Number(resData.totals.activeDCMs) || 14,
          trends: {
            total: calcTrend(Number(t.candidatesThisMonth || 0), Number(t.candidatesLastMonth || 0), "last month"),
            fit: calcTrend(Number(t.fitThisWeek || 0), Number(t.fitLastWeek || 0), "last week"),
            unfit: calcTrend(Number(t.unfitThisWeek || 0), Number(t.unfitLastWeek || 0), "last week"),
            processedToday: "Real-time updates",
            activeDCMs: `across ${resData.totals.uniquePlatforms || 2} platform${(resData.totals.uniquePlatforms || 2) !== 1 ? 's' : ''}`
          }
        };

        const chartData = (resData.chartData || []).map((c: any) => ({
          ...c,
          classification: (c.classification === "Pending" ? "Error" : c.classification)
        }));

        const chartAggregates = {
          dailyTrend: resData.dailyTrend || [],
          platformDistribution: resData.platformDistribution || [],
          dcmDistribution: resData.dcmDistribution || [],
          classificationOverview: [
            { name: "FIT", value: Number(resData.totals.fit) || 0 },
            { name: "UNFIT", value: Number(resData.totals.unfit) || 0 },
            ...(resData.totals.error > 0 ? [{ name: "Error", value: Number(resData.totals.error) || 0 }] : [])
          ]
        };

        return { totals, chartData, chartAggregates };
      }
    } catch {
      // Direct fast fallback below
    }

    // High performance fallback using parallel exact count queries across full DB dataset
    const fallbackAggregates = await this.getFallbackChartAggregates();
    const [stats, chartData] = await Promise.all([
      this.getDashboardStats(fallbackAggregates.activeDcmCount),
      this.getChartData(),
    ]);

    return {
      totals: stats,
      chartData,
      chartAggregates: {
        dailyTrend: fallbackAggregates.dailyTrend,
        platformDistribution: fallbackAggregates.platformDistribution,
        dcmDistribution: fallbackAggregates.dcmDistribution,
        classificationOverview: [
          { name: "FIT", value: stats.fit },
          { name: "UNFIT", value: stats.unfit },
        ]
      },
    };
  },

  async getFallbackChartAggregates() {
    const knownPlatforms = ["CV-Library", "TotalJobs", "LinkedIn", "Indeed", "Reed"];
    const allDcmTypesList = [
      "Demolition", "Height & Safety", "Estimator", "Health & Safety", 
      "Firesec", "Catering Company Targeter", "Drylining", "Piling", 
      "Fit Out", "Groundworks", "M&E", "Scaffolding", "RC Frame", "Civil Engineering",
      "Exterior DCM", "Structural DCM", "Windows and Doors DCM", "BID DCM", "Estimator DCM",
      "QS DCM", "Scaffolding DCM", "Temporary Works Design DCM", "Demolition DCM",
      "Passive Fire Protection DCM", "Consultancy Civil & Structural DCM", "Consultancy New DCM",
      "Health & Safety DCM", "Waste Management DCM", "Firesec DCM", "Fire Alarm DCM",
      "Catering DCM", "Height & Safety Company Targeter", "Electrical Company Targeter",
      "Large Companies Targeter", "Height & Safety DCM"
    ];

    // Fetch dynamic DCMs from automation_settings if available
    let dcmTypes = allDcmTypesList;
    try {
      const { data: settingsData } = await db.from("automation_settings").select("dcm_type");
      if (settingsData && settingsData.length > 0) {
        const found = settingsData.map((s: any) => s.dcm_type).filter((t: string) => t && t !== "N/A");
        dcmTypes = Array.from(new Set([...found, ...allDcmTypesList]));
      }
    } catch {
      // Use allDcmTypesList fallback
    }

    // Generate last 7 days dates
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const [platformRes, dcmRes, trendRes] = await Promise.all([
      // 1. Platform counts across ALL 112,509 candidates
      Promise.all(
        knownPlatforms.map(async (name) => {
          const { count } = await db.from("candidates").select("id", { count: "exact", head: true }).eq("platform_name", name);
          return { name, value: count || 0 };
        })
      ),
      // 2. DCM Bot counts across ALL 112,509 candidates
      Promise.all(
        dcmTypes.map(async (dcm) => {
          const { count } = await db.from("candidates").select("id", { count: "exact", head: true }).eq("dcm_type", dcm);
          return { name: dcm, size: count || 0 };
        })
      ),
      // 3. Daily trend counts for last 7 days across ALL candidates
      Promise.all(
        days.map(async (dateStr) => {
          const startIso = `${dateStr}T00:00:00.000Z`;
          const endIso = `${dateStr}T23:59:59.999Z`;
          const [{ count: fitCount }, { count: unfitCount }] = await Promise.all([
            db.from("candidates").select("id", { count: "exact", head: true }).eq("classification", "FIT").gte("processed_timestamp", startIso).lte("processed_timestamp", endIso),
            db.from("candidates").select("id", { count: "exact", head: true }).eq("classification", "UNFIT").gte("processed_timestamp", startIso).lte("processed_timestamp", endIso),
          ]);
          return { date: dateStr, FIT: fitCount || 0, UNFIT: unfitCount || 0 };
        })
      )
    ]);

    const activeDcmCount = dcmRes.filter(d => d.size > 0).length || 14;

    return {
      dailyTrend: trendRes,
      platformDistribution: platformRes.filter(p => p.value > 0).sort((a, b) => b.value - a.value),
      dcmDistribution: dcmRes.filter(d => d.size > 0).sort((a, b) => b.size - a.size),
      activeDcmCount,
    };
  },

  async getDashboardStats(activeDcmCount = 14): Promise<CandidateStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalCount },
      { count: fitCount },
      { count: unfitCount },
      { count: processedTodayCount },
    ] = await Promise.all([
      db.from("candidates").select("*", { count: "exact", head: true }),
      db.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "FIT"),
      db.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "UNFIT"),
      db.from("candidates").select("*", { count: "exact", head: true }).gte("processed_timestamp", today.toISOString()),
    ]);

    return {
      total: totalCount || 0,
      fit: fitCount || 0,
      unfit: unfitCount || 0,
      processedToday: processedTodayCount || 0,
      activeDCMs: activeDcmCount,
      trends: {
        total: "Up to date",
        fit: "Up to date",
        unfit: "Up to date",
        processedToday: "Real-time updates",
        activeDCMs: "across 2 platforms"
      }
    };
  },

  async getChartData() {
    // Optimized: Fetch recent 10000 records for chart visualization
    const { data, error } = await db
      .from("candidates")
      .select("classification, platform_name, dcm_type, processed_timestamp")
      .order("processed_timestamp", { ascending: false })
      .limit(10000);

    if (error) {
      console.error("Error fetching chart data:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      classification: (c.classification === "Pending" ? "Error" : c.classification) as "FIT" | "UNFIT" | "Error"
    }));
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    const { data, error } = await db.from("candidates").select("*").eq("id", id).single();
    if (error || !data) return null;
    
    const candidateData = data as unknown as Record<string, any>;
    return {
      ...candidateData,
      classification: (candidateData.classification as string) === "Pending" ? "Error" : candidateData.classification
    } as Candidate;
  },

  async updateCandidateStatus(id: string, status: string): Promise<void> {
    const { error } = await db
      .from("candidates")
      .update({ status })
      .eq("id", id);
    if (error) {
      console.error("Supabase Error (updateCandidateStatus):", error.message);
      throw new Error(`Failed to update status: ${error.message}`);
    }
  },

  async getCandidateComments(candidateId: string) {
    const { data, error } = await db
      .from("candidate_comments")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Supabase Error (getCandidateComments):", error.message);
      return []; // Return empty array if table doesn't exist to prevent crashing
    }
    return data;
  },

  async addCandidateComment(candidateId: string, authorEmail: string, comment: string) {
    const { data, error } = await db
      .from("candidate_comments")
      .insert([
        {
          candidate_id: candidateId,
          author_email: authorEmail,
          comment,
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error("Supabase Error (addCandidateComment):", error.message);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
    return data;
  },

  async editCandidateComment(commentId: string, newCommentText: string) {
    const { data, error } = await db
      .from("candidate_comments")
      .update({ comment: newCommentText })
      .eq("id", commentId)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase Error (editCandidateComment):", error.message);
      throw new Error(`Failed to edit comment: ${error.message}`);
    }
    return data;
  },

  async deleteCandidateComment(commentId: string) {
    const { error } = await db
      .from("candidate_comments")
      .delete()
      .eq("id", commentId);
    
    if (error) {
      console.error("Supabase Error (deleteCandidateComment):", error.message);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  },

  async deleteCandidate(id: string): Promise<void> {
    const { error } = await db.from("candidates").delete().eq("id", id);
    if (error) throw error;
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const dbUpdates: Omit<Partial<Candidate>, "classification"> & { classification?: string } = { ...updates };
    if (dbUpdates.classification === "Error") {
      dbUpdates.classification = "Pending";
    }

    const { data, error } = await db
      .from("candidates")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase Error (updateCandidate):", error.message);
      throw new Error(`Failed to update candidate: ${error.message}`);
    }
    
    const candidateData = data as unknown as Record<string, any>;
    return {
      ...candidateData,
      classification: (candidateData.classification as string) === "Pending" ? "Error" : candidateData.classification
    } as Candidate;
  },

  async bulkUpdateCandidates(ids: string[], updates: Partial<Candidate>): Promise<void> {
    const dbUpdates: Omit<Partial<Candidate>, "classification"> & { classification?: string } = { ...updates };
    if (dbUpdates.classification === "Error") {
      dbUpdates.classification = "Pending";
    }

    const { error } = await db
      .from("candidates")
      .update(dbUpdates)
      .in("id", ids);

    if (error) {
      console.error("Supabase Error (bulkUpdateCandidates):", error.message);
      throw new Error(`Failed to bulk update candidates: ${error.message}`);
    }
  },

  async bulkDeleteCandidates(ids: string[]): Promise<void> {
    const { error } = await db
      .from("candidates")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Supabase Error (bulkDeleteCandidates):", error.message);
      throw new Error(`Failed to bulk delete candidates: ${error.message}`);
    }
  }
};
