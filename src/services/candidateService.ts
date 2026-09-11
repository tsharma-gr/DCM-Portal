/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { Candidate, CandidateStats } from "@/types/candidate";

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
    let query = supabase
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
      const { data, error } = await supabase.rpc("get_dashboard_summary");
      if (!error && data && data.totals) {
        const t = data.trends || {};
        
        const calcTrend = (current: number, previous: number, label: string) => {
          if (!previous || previous === 0) {
            return current > 0 ? `+100% from ${label}` : `0% from ${label}`;
          }
          const diff = Math.round(((current - previous) / previous) * 100);
          return `${diff >= 0 ? '+' : ''}${diff}% from ${label}`;
        };

        const totals: CandidateStats = {
          total: Number(data.totals.total) || 0,
          fit: Number(data.totals.fit) || 0,
          unfit: Number(data.totals.unfit) || 0,
          processedToday: Number(data.totals.processedToday) || 0,
          activeDCMs: Number(data.totals.activeDCMs) || 0,
          trends: {
            total: calcTrend(Number(t.candidatesThisMonth || 0), Number(t.candidatesLastMonth || 0), "last month"),
            fit: calcTrend(Number(t.fitThisWeek || 0), Number(t.fitLastWeek || 0), "last week"),
            unfit: calcTrend(Number(t.unfitThisWeek || 0), Number(t.unfitLastWeek || 0), "last week"),
            processedToday: "Real-time updates",
            activeDCMs: `across ${data.totals.uniquePlatforms || 0} platform${(data.totals.uniquePlatforms || 0) !== 1 ? 's' : ''}`
          }
        };

        const chartData = (data.chartData || []).map((c: any) => ({
          ...c,
          classification: (c.classification === "Pending" ? "Error" : c.classification)
        }));

        const chartAggregates = {
          dailyTrend: data.dailyTrend || [],
          platformDistribution: data.platformDistribution || [],
          dcmDistribution: data.dcmDistribution || [],
          classificationOverview: [
            { name: "FIT", value: Number(data.totals.fit) || 0 },
            { name: "UNFIT", value: Number(data.totals.unfit) || 0 },
            ...(data.totals.error > 0 ? [{ name: "Error", value: Number(data.totals.error) || 0 }] : [])
          ]
        };

        return { totals, chartData, chartAggregates };
      }
    } catch (err) {
      console.warn("RPC get_dashboard_summary failed or not installed, falling back", err);
    }

    // High performance fallback
    const [stats, chartData] = await Promise.all([
      this.getDashboardStats(),
      this.getChartData(),
    ]);

    return {
      totals: stats,
      chartData,
    };
  },

  async getDashboardStats(): Promise<CandidateStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalCount },
      { count: fitCount },
      { count: unfitCount },
      { count: processedTodayCount },
    ] = await Promise.all([
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "FIT"),
      supabase.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "UNFIT"),
      supabase.from("candidates").select("*", { count: "exact", head: true }).gte("processed_timestamp", today.toISOString()),
    ]);

    return {
      total: totalCount || 0,
      fit: fitCount || 0,
      unfit: unfitCount || 0,
      processedToday: processedTodayCount || 0,
      activeDCMs: 14,
      trends: {
        total: "+10% from last month",
        fit: "+15% from last week",
        unfit: "+12% from last week",
        processedToday: "Real-time updates",
        activeDCMs: "across 2 platforms"
      }
    };
  },

  async getChartData() {
    // Optimized: Fetch recent 2000 records for chart visualization instead of downloading the entire database in a loop
    const { data, error } = await supabase
      .from("candidates")
      .select("classification, platform_name, dcm_type, processed_timestamp")
      .order("processed_timestamp", { ascending: false })
      .limit(2000);

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
    const { data, error } = await supabase.from("candidates").select("*").eq("id", id).single();
    if (error || !data) return null;
    
    return {
      ...data,
      classification: (data.classification as string) === "Pending" ? "Error" : data.classification
    } as Candidate;
  },

  async updateCandidateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id);
    if (error) {
      console.error("Supabase Error (updateCandidateStatus):", error.message);
      throw new Error(`Failed to update status: ${error.message}`);
    }
  },

  async getCandidateComments(candidateId: string) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from("candidate_comments")
      .delete()
      .eq("id", commentId);
    
    if (error) {
      console.error("Supabase Error (deleteCandidateComment):", error.message);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  },

  async deleteCandidate(id: string): Promise<void> {
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) throw error;
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const dbUpdates: Omit<Partial<Candidate>, "classification"> & { classification?: string } = { ...updates };
    if (dbUpdates.classification === "Error") {
      dbUpdates.classification = "Pending";
    }

    const { data, error } = await supabase
      .from("candidates")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase Error (updateCandidate):", error.message);
      throw new Error(`Failed to update candidate: ${error.message}`);
    }
    
    return {
      ...data,
      classification: (data.classification as string) === "Pending" ? "Error" : data.classification
    } as Candidate;
  },

  async bulkUpdateCandidates(ids: string[], updates: Partial<Candidate>): Promise<void> {
    const dbUpdates: Omit<Partial<Candidate>, "classification"> & { classification?: string } = { ...updates };
    if (dbUpdates.classification === "Error") {
      dbUpdates.classification = "Pending";
    }

    const { error } = await supabase
      .from("candidates")
      .update(dbUpdates)
      .in("id", ids);

    if (error) {
      console.error("Supabase Error (bulkUpdateCandidates):", error.message);
      throw new Error(`Failed to bulk update candidates: ${error.message}`);
    }
  },

  async bulkDeleteCandidates(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from("candidates")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("Supabase Error (bulkDeleteCandidates):", error.message);
      throw new Error(`Failed to bulk delete candidates: ${error.message}`);
    }
  }
};
