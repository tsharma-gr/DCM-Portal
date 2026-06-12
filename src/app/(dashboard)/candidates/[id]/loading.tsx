import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function CandidateDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground pl-0">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Candidates</span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card Skeleton */}
        <div className="md:col-span-1">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader className="text-center pb-4">
              <Skeleton className="mx-auto w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto mt-2" />
              <div className="mt-4 flex justify-center">
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </CardHeader>
            <div className="px-6">
              <Skeleton className="h-px w-full" />
            </div>
            <CardContent className="pt-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
              <div className="pt-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Reasoning Skeleton */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full rounded-lg" />
              
              <div className="mt-8">
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full rounded-md" />
                  <Skeleton className="h-16 w-full rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
