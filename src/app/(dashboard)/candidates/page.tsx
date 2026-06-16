"use client";

import { useSearchParams } from "next/navigation";
import { useCandidatesList } from "@/hooks/use-candidates";
import { CandidateTable } from "@/components/candidates/candidate-table";
import CandidatesLoading from "./loading";

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  
  const params = {
    search: searchParams.get("search") || undefined,
    classification: searchParams.get("classification") || undefined,
    dcmType: searchParams.get("dcmType") || undefined,
    platform: searchParams.get("platform") || undefined,
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "10",
  };

  const { candidates, count, isLoading } = useCandidatesList(params);

  if (isLoading) {
    return <CandidatesLoading />;
  }

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight">Candidates</h1>
        <p className="text-muted-foreground mt-2">
          Manage and review AI-classified CVs across all your active DCMs.
        </p>
      </div>

      <CandidateTable candidates={candidates} totalCount={count} />
    </div>
  );
}
