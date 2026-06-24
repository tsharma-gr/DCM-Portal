"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import { motion } from "framer-motion";

interface RecentCandidatesProps {
  candidates: Candidate[];
}

export function RecentCandidates({ candidates }: RecentCandidatesProps) {
  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "FIT":
        return <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">FIT</Badge>;
      case "UNFIT":
        return <Badge className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">UNFIT</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20">{classification || "Error"}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="mt-4"
    >
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-heading">Recent Candidates</CardTitle>
          <CardDescription>
            The latest CVs processed by the TalentVerse AI across all DCMs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 bg-background/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border/50">
                  <TableHead className="w-[200px]">Candidate Name</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Processed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50 border-b-border/50 transition-colors">
                      <TableCell className="font-medium">{candidate.candidate_name}</TableCell>
                      <TableCell>{getClassificationBadge(candidate.classification)}</TableCell>
                      <TableCell className="text-muted-foreground">{candidate.current_position || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {candidate.platform_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{candidate.location || "N/A"}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(candidate.processed_timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
