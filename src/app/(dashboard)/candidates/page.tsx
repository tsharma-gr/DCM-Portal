"use client";

import { useSearchParams } from "next/navigation";
import { useCandidatesList } from "@/hooks/use-candidates";
import { CandidateTable } from "@/components/candidates/candidate-table";
import CandidatesLoading from "./loading";
import { Suspense } from "react";

function CandidatesContent() {
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
          Review and manage parsed candidates from the AI pipeline.
        </p>
      </div>

      <CandidateTable candidates={candidates} totalCount={count} />
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<CandidatesLoading />}>
      <CandidatesContent />
    </Suspense>
  );
}
