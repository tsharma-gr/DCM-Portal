"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Activity, Server, Clock, Database } from "lucide-react";
import { CandidateStats } from "@/types/candidate";

interface BotHealthMonitorProps {
  stats: CandidateStats;
}

export function BotHealthMonitor({ stats }: BotHealthMonitorProps) {
  // Using dummy values for demonstration, in a real app these would come from an API endpoint for bots
  const todaysTarget = 5000;
  const todayExtracted = stats.newCandidates || 1240; 
  const progressPercent = Math.min(100, Math.round((todayExtracted / todaysTarget) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="h-full"
    >
      <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm relative overflow-hidden group h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-50"></div>
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="font-heading text-lg tracking-wide flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              Bot Health Monitor
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              All Systems Operational
            </div>
          </CardTitle>
          <CardDescription className="text-sm">
            Live status of CV extraction and parsing bots.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-6">
          
          {/* Progress Section */}
          <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Extraction</span>
                <span className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                  {todayExtracted.toLocaleString()} <span className="text-sm text-slate-400 font-normal">/ {todaysTarget.toLocaleString()} CVs</span>
                </span>
              </div>
              <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full"
              />
            </div>
          </div>

          {/* Bot Nodes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-border/60 rounded-[10px] bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[14px] text-[var(--ink)]">QS-CV Library Scraper</span>
                  <span className="text-[12px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last sync: 2 mins ago
                  </span>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none">Running</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border border-border/60 rounded-[10px] bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[14px] text-[var(--ink)]">AI Parser Engine</span>
                  <span className="text-[12px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Processing batch...
                  </span>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none">Active</Badge>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
