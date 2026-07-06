export interface Candidate {
  id: string; // usually UUID
  candidate_name: string;
  classification: "FIT" | "UNFIT" | "Error";
  ai_reasoning: string;
  current_position: string;
  location: string;
  cv_reference: string;
  cv_link: string;
  platform_name: string;
  dcm_type: string; // 'Exterior', 'Interior', 'Quantity Surveyor', etc.
  processed_timestamp: string; // ISO timestamp
  status?: string;
  job_title?: string;
  desired_role?: string;
  email?: string;
  phone_number?: string;
  linkedin_url?: string;
  salary_range?: string;
  t1_tenure?: number;
  t2_tenure?: number;
  business_specialization?: string;
  recruitly_id?: string;
  current_company?: string;
}

export interface CandidateComment {
  id: string;
  candidate_id: string;
  author_email: string;
  comment: string;
  created_at: string;
}

export type CandidateStats = {
  total: number;
  fit: number;
  unfit: number;
  processedToday: number;
  activeDCMs: number;
};
