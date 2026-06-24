import { Skeleton } from "@/components/ui/skeleton";

export default function CandidatesLoading() {
  return (
    <div className="flex flex-col space-y-6 min-h-[200vh]">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="space-y-4 mt-4">
        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50">
          <Skeleton className="h-10 w-full sm:w-72" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
