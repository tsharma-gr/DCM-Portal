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
import { MapPin } from "lucide-react";

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
      <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--violet)] to-[var(--violet-glow)] opacity-50"></div>
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="font-heading text-lg tracking-wide flex items-center justify-between">
            Recent Activity
            <div className="h-6 px-3 rounded-full bg-[var(--violet)]/10 text-[var(--violet)] text-xs flex items-center font-semibold">
              Live Feed
            </div>
          </CardTitle>
          <CardDescription className="text-sm">
            The latest CVs processed by TalentVerse AI across all DCMs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(20,15,50,0.03)] flex flex-col">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border">
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto w-[200px]">Candidate Name</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Classification</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Platform</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Location</TableHead>
                  <TableHead className="bg-[#FBFAFE] text-right text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border h-auto">Processed Date</TableHead>
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
                    <TableRow key={candidate.id} className="hover:bg-muted/50 border-b border-border transition-colors group cursor-pointer">
                      <TableCell className="px-[18px] py-[14px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[13.5px] text-[var(--ink)] leading-tight transition-colors duration-200 group-hover:text-[var(--violet)]">{candidate.candidate_name}</span>
                          {candidate.current_position && (
                            <span className="truncate text-[12.5px] text-slate-400 font-medium leading-tight mt-0.5">{candidate.current_position}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-[18px] py-[14px]">{getClassificationBadge(candidate.classification)}</TableCell>
                      <TableCell className="px-[18px] py-[14px]">
                        <Badge variant="outline" className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border-border/60 bg-background/50">
                          {candidate.platform_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-[18px] py-[14px] text-muted-foreground text-[13.5px]">
                        <div className="flex items-center gap-1.5">
                          {candidate.location && candidate.location !== 'Unknown' && <MapPin className="h-3.5 w-3.5 text-[#EC4899] shrink-0" />}
                          <span className="truncate">{candidate.location || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-[18px] py-[14px] text-right pr-[24px]">
                        <div className="flex flex-col items-end space-y-0.5">
                          <span className="text-[13px] font-medium text-[var(--ink)]">
                            {new Date(candidate.processed_timestamp).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'Europe/London'
                            })}
                          </span>
                          <span className="text-[11.5px] font-mono text-muted-foreground uppercase tracking-wider">
                            {new Date(candidate.processed_timestamp).toLocaleTimeString('en-GB', {
                              hour: 'numeric',
                              minute: '2-digit',
                              timeZone: 'Europe/London'
                            })}
                          </span>
                        </div>
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
