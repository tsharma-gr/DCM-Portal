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
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ActionRequiredQueueProps {
  candidates: Candidate[];
}

export function ActionRequiredQueue({ candidates }: ActionRequiredQueueProps) {
  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "UNFIT":
        return <Badge className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">UNFIT</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20">{classification || "Error"}</Badge>;
    }
  };

  const actionCandidates = candidates.filter(c => c.classification === 'UNFIT' || c.status === 'Error').slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm relative overflow-hidden group h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500 opacity-50"></div>
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="font-heading text-lg tracking-wide flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Action Required Queue
            </div>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              {actionCandidates.length} Pending
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Candidates flagged as UNFIT or encountered processing errors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(20,15,50,0.03)] flex flex-col">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border">
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Candidate</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Flag</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-right text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-[200px] text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="font-medium text-[var(--ink)]">All caught up!</p>
                        <p className="text-sm">No exceptions require manual review right now.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  actionCandidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50 border-b border-border transition-colors group cursor-pointer">
                      <TableCell className="px-[18px] py-[14px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[13.5px] text-[var(--ink)] leading-tight">{candidate.candidate_name}</span>
                          {candidate.current_position && (
                            <span className="truncate text-[12.5px] text-slate-400 font-medium leading-tight mt-0.5 max-w-[150px]">{candidate.current_position}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-[18px] py-[14px]">
                        {getClassificationBadge(candidate.classification)}
                      </TableCell>
                      <TableCell className="px-[18px] py-[14px] text-right">
                        <Link href={`/candidates?search=${encodeURIComponent(candidate.candidate_name)}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-[var(--violet)] hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
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
