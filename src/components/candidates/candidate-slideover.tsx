"use client";

import { useState, useEffect } from "react";
import { Candidate, CandidateComment } from "@/types/candidate";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CandidateDetail } from "./candidate-detail";
import { candidateService } from "@/services/candidateService";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface CandidateSlideOverProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateSlideOver({ candidate, isOpen, onClose }: CandidateSlideOverProps) {
  const [comments, setComments] = useState<CandidateComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("Unknown User");

  useEffect(() => {
    async function loadData() {
      if (!candidate) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserEmail(user?.email || "Unknown User");

        const fetchedComments = await candidateService.getCandidateComments(candidate.id);
        setComments(fetchedComments || []);
      } catch (error) {
        console.error("Failed to load candidate data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen && candidate) {
      loadData();
    }
  }, [candidate, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full !max-w-[90vw] sm:!max-w-[600px] lg:!max-w-[800px] xl:!max-w-[900px] p-0 border-l border-border overflow-y-auto bg-[#F8F9FC]"
      >
        {!candidate ? null : loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--violet)]" />
            <p className="text-sm font-medium">Loading candidate details...</p>
          </div>
        ) : (
          <CandidateDetail 
            candidate={candidate} 
            comments={comments} 
            currentUserEmail={currentUserEmail}
            isSlideOver={true}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
