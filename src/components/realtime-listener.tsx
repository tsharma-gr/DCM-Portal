"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function RealtimeListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes on the candidates table
    const candidatesChannel = supabase.channel("public:candidates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        () => {
          // Tell Next.js to re-fetch Server Components when data changes
          router.refresh();
        }
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
