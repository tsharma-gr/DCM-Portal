import { candidateService } from "@/services/candidateService";
import { CandidateDetail } from "@/components/candidates/candidate-detail";
import { notFound } from "next/navigation";

export const revalidate = 0; // Disable caching

interface CandidatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const resolvedParams = await params;
  const candidate = await candidateService.getCandidateById(resolvedParams.id);

  if (!candidate) {
    notFound();
  }

  const comments = await candidateService.getCandidateComments(resolvedParams.id);
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserEmail = user?.email || "Unknown User";

  return (
    <div className="animate-in fade-in duration-500">
      <CandidateDetail 
        candidate={candidate} 
        comments={comments || []} 
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
