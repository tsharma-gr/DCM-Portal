"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { toast } from "sonner";

export function RealtimeListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes on the candidates table
    const candidatesChannel = supabase.channel("public:candidates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "candidates" },
        (payload) => {
          const newCandidate = payload.new;
          if (newCandidate.classification === "FIT") {
            toast.success(`🎉 AI found a new FIT candidate for ${newCandidate.dcm_type || 'a DCM'}!`, {
              description: newCandidate.candidate_name || "New resume processed.",
            });
          } else {
            toast.info(`New candidate processed: ${newCandidate.classification || 'Pending'}`, {
              description: newCandidate.candidate_name || "New resume processed.",
            });
          }
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "candidates" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "candidates" },
        () => router.refresh()
      )
      .subscribe();

    // Subscribe to changes on the comments table
    const commentsChannel = supabase.channel("public:candidate_comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidate_comments" },
        () => {
          // Tell Next.js to re-fetch Server Components when data changes
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(candidatesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [router, supabase]);

  return null;
}
