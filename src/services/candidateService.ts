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
      query = query.eq("classification", filters.classification);
    }
    if (filters?.platform && filters.platform !== "All") {
      query = query.eq("platform_name", filters.platform);
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
    return { data: data as Candidate[], count: count || 0 };
  },

  async getDashboardStats(): Promise<CandidateStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalCount },
      { count: fitCount },
      { count: unfitCount },
      { count: processedTodayCount },
      { data: dcmTypes },
    ] = await Promise.all([
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "FIT"),
      supabase.from("candidates").select("*", { count: "exact", head: true }).eq("classification", "UNFIT"),
      supabase.from("candidates").select("*", { count: "exact", head: true }).gte("processed_timestamp", today.toISOString()),
      supabase.from("candidates").select("dcm_type").not("dcm_type", "is", null),
    ]);

    const activeDCMs = new Set((dcmTypes || []).map((row) => row.dcm_type)).size;

    return {
      total: totalCount || 0,
      fit: fitCount || 0,
      unfit: unfitCount || 0,
      processedToday: processedTodayCount || 0,
      activeDCMs: activeDCMs || 0,
    };
  },

  async getChartData() {
    const { data } = await supabase.from("candidates").select("classification, platform_name, dcm_type, processed_timestamp");
    return data || [];
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    const { data, error } = await supabase.from("candidates").select("*").eq("id", id).single();
    if (error) return null;
    return data as Candidate;
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
    const { data, error } = await supabase
      .from("candidates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase Error (updateCandidate):", error.message);
      throw new Error(`Failed to update candidate: ${error.message}`);
    }
    return data;
  },

  async bulkUpdateCandidates(ids: string[], updates: Partial<Candidate>): Promise<void> {
    const { error } = await supabase
      .from("candidates")
      .update(updates)
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
