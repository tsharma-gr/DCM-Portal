/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Loader2, Clock, Server, Globe2, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const QUEUE1_CONFIG = [
  { name: "Exterior DCM", dcmType: "Exterior" },
  { name: "Passive Fire DCM", dcmType: "Passive Fire Protection" },
  { name: "Consultancy DCM", dcmType: "Consultancy Civil & Structural" },
  { name: "Demolition DCM", dcmType: "Demolition" },
  { name: "Bid DCM", dcmType: "BID" },
  { name: "Health & Safety DCM", dcmType: "Health & Safety" },
];

const QUEUE2_CONFIG = [
  { name: "Structural DCM", dcmType: "Structural" },
  { name: "Windows & Doors DCM", dcmType: "Windows and Doors" },
  { name: "Scaffolding DCM", dcmType: "Scaffolding" },
  { name: "Temporary Works DCM", dcmType: "Temporary Works Design" },
  { name: "Estimator DCM", dcmType: "Estimator" },
  { name: "Waste Management DCM", dcmType: "Waste Management / Recycling" },
];

type BotStatusData = {
  name: string;
  dcmType: string;
  candidates: number;
  status: "pending" | "running" | "completed";
  timeLabel: string;
  lastTimestamp: number;
};

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function BotStatusPage() {
  const [q1Bots, setQ1Bots] = useState<BotStatusData[]>(QUEUE1_CONFIG.map(b => ({ ...b, candidates: 0, status: "pending", timeLabel: "Not started", lastTimestamp: 0 })));
  const [q2Bots, setQ2Bots] = useState<BotStatusData[]>(QUEUE2_CONFIG.map(b => ({ ...b, candidates: 0, status: "pending", timeLabel: "Not started", lastTimestamp: 0 })));
  
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchTodayStats = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayIso = startOfToday.toISOString();

        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        
        while (true) {
          const { data, error } = await supabase
            .from("candidates")
            .select("dcm_type, processed_timestamp")
            .gte("processed_timestamp", todayIso)
            .range(from, from + step - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          allData = allData.concat(data);
          if (data.length < step) break;
          from += step;
        }

        const statsMap: Record<string, { count: number, earliestTs: number, latestTs: number }> = {};
        const total = allData.length;

        if (allData.length > 0) {
          allData.forEach(row => {
            if (!statsMap[row.dcm_type]) {
              statsMap[row.dcm_type] = { count: 0, earliestTs: Infinity, latestTs: 0 };
            }
            statsMap[row.dcm_type].count += 1;
            
            const rowTs = new Date(row.processed_timestamp).getTime();
            if (rowTs > statsMap[row.dcm_type].latestTs) {
              statsMap[row.dcm_type].latestTs = rowTs;
            }
            if (rowTs < statsMap[row.dcm_type].earliestTs) {
              statsMap[row.dcm_type].earliestTs = rowTs;
            }
          });
        }

        setTotalProcessed(total);

        const now = Date.now();
        const RUNNING_THRESHOLD_MS = 7 * 60 * 1000; // 7 minutes

        const processQueue = (config: typeof QUEUE1_CONFIG) => {
          const processed = config.map(bot => {
            const stats = statsMap[bot.dcmType];
            if (!stats) {
              return { ...bot, candidates: 0, status: "pending", timeLabel: "Not started", lastTimestamp: 0, earliestTs: 0 };
            }

            const timeSinceLast = now - stats.latestTs;
            let status: "pending" | "running" | "completed" = "completed";
            
            if (timeSinceLast < RUNNING_THRESHOLD_MS) {
              status = "running";
            }

            return {
              name: bot.name,
              dcmType: bot.dcmType,
              candidates: stats.count,
              status,
              timeLabel: "",
              lastTimestamp: stats.latestTs,
              earliestTs: stats.earliestTs
            };
          });

          return processed.map((bot, index, array) => {
            if (bot.status === "pending") {
              bot.timeLabel = "Not started";
              return bot as BotStatusData;
            }

            const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
            const latestStr = formatTime(bot.lastTimestamp);
            const startStr = formatTime(bot.earliestTs);
            let endStr = bot.status === "running" ? "Running" : latestStr;

            // If this bot completed, check if it's waiting for the next bot in the queue
            const timeSinceLast = now - bot.lastTimestamp;
            const nextBot = array[index + 1];
            if (bot.status === "completed" && nextBot && nextBot.candidates === 0 && timeSinceLast < 15 * 60 * 1000) {
              endStr += " (Waiting next bot)";
            }

            bot.timeLabel = `Latest: ${latestStr} | Start: ${startStr} | End: ${endStr}`;
            return bot as BotStatusData;
          });
        };

        setQ1Bots(processQueue(QUEUE1_CONFIG));
        setQ2Bots(processQueue(QUEUE2_CONFIG));
      } catch (err) {
        console.error("Failed to fetch bot stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayStats();
    const interval = setInterval(fetchTodayStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getQueueMetrics = (bots: BotStatusData[]) => {
    let completedCount = 0;
    let isActive = false;
    
    bots.forEach(b => {
      if (b.status === "completed") completedCount++;
      if (b.status === "running") isActive = true;
    });

    const progress = Math.round(((completedCount + (isActive ? 0.5 : 0)) / bots.length) * 100);
    
    return {
      progress: Math.min(progress, 100),
      status: isActive ? "active" : "sleeping"
    };
  };

  const q1Metrics = getQueueMetrics(q1Bots);
  const q2Metrics = getQueueMetrics(q2Bots);

  const queueData = [
    {
      id: "queue1",
      name: "Queue 1 (Humres Account)",
      browser: "Bot Browser 1 : Port 9222",
      progress: q1Metrics.progress,
      status: q1Metrics.status,
      bots: q1Bots
    },
    {
      id: "queue2",
      name: "Queue 2 (Huntek Account)",
      browser: "Bot Browser 2 : Port 9223",
      progress: q2Metrics.progress,
      status: q2Metrics.status,
      bots: q2Bots
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-100px)] p-6 bg-transparent">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1400px] mx-auto space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-8 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--violet)]/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex flex-col relative z-10">
            <h1 className="text-[28px] font-extrabold tracking-tight flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--violet)] blur-md opacity-20 rounded-xl" />
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[var(--violet)] to-[#EC4899] flex items-center justify-center text-white shadow-lg relative z-10">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ink)] to-slate-500">
                  Live Server Status
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400/90 bg-slate-50/80 px-2.5 py-1 rounded-[6px] border border-slate-200/50 shadow-sm uppercase tracking-wider cursor-help mt-1" title="All times displayed in UK Time (GMT/BST)">
                  <Globe2 className="w-3 h-3 opacity-70" />
                  UK Time
                </div>
              </div>
            </h1>
            <p className="text-[14px] text-slate-500 mt-2 font-medium tracking-wide">Monitor real-time candidate scraping operations running on your VPS.</p>
          </div>
          <Link href="/bot-analytics">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 rounded-full shadow-sm relative z-10 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-bold text-[13px] tracking-wider uppercase">View Historical Analytics</span>
            </motion.div>
          </Link>
        </motion.div>

        {/* Global Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-8 rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(147,83,245,0.08)] transition-shadow relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700">
              <Globe2 className="w-40 h-40 text-[var(--violet)]" />
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-[var(--violet)]/10 flex items-center justify-center mb-5 text-[var(--violet)] shadow-inner">
              <Globe2 className="w-7 h-7" />
            </div>
            <div className="text-[14px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Active Portals</div>
            <div className="text-4xl font-extrabold text-[var(--ink)] tracking-tight">2</div>
            <div className="text-[14px] text-slate-500 font-semibold mt-2">CV-Library & TotalJobs</div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-8 rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] transition-shadow relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700">
              <Users className="w-40 h-40 text-emerald-500" />
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-emerald-50 flex items-center justify-center mb-5 text-emerald-600 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div className="text-[14px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Candidates Processed</div>
            <div className="text-4xl font-extrabold text-[var(--ink)] flex items-center gap-3 tracking-tight">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : totalProcessed.toLocaleString()}
            </div>
            <div className="text-[14px] text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5" /> Processed today
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="p-8 rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.08)] transition-shadow relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck className="w-40 h-40 text-blue-500" />
            </div>
            <div className="w-14 h-14 rounded-[16px] bg-blue-50 flex items-center justify-center mb-5 text-blue-600 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="text-[14px] text-slate-400 font-bold mb-1 uppercase tracking-widest">Security Bypass</div>
            <div className="text-4xl font-extrabold text-[var(--ink)] tracking-tight">100%</div>
            <div className="text-[14px] text-slate-500 font-semibold mt-2">Sessions hijacked successfully</div>
          </motion.div>
        </motion.div>

        {/* Queues Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {queueData.map((queue) => (
            <motion.div 
              key={queue.id} 
              variants={itemVariants} 
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "flex flex-col h-full rounded-[32px] bg-white border overflow-hidden transition-all duration-500 relative group shadow-sm",
                queue.status === "active" ? "border-[var(--violet)]/40 shadow-[0_20px_60px_rgba(147,83,245,0.12)]" : "border-slate-100 hover:shadow-xl"
              )}
            >
              {queue.status === "active" && (
                <>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] ring-1 ring-inset ring-[var(--violet)]/30" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--violet)] to-transparent opacity-50" />
                </>
              )}
              
              <div className="p-6 md:p-8 border-b border-slate-50 bg-[#FBFAFE]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-[16px] shadow-sm", queue.status === "active" ? "bg-[var(--violet)] text-white shadow-[var(--violet-glow)]" : "bg-slate-100 text-slate-500")}>
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-[19px] font-bold text-[var(--ink)] tracking-tight">{queue.name}</h2>
                      <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{queue.browser}</p>
                    </div>
                  </div>
                  {queue.status === "active" ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-[var(--violet)]/10 text-[var(--violet)] text-[12px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-2 self-start sm:self-auto border border-[var(--violet)]/20 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[var(--violet)]" /> Running
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Sleeping
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Queue Progress</span>
                    <span className={cn(queue.status === "active" ? "text-[var(--violet)]" : "text-slate-600")}>{queue.progress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${queue.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full relative overflow-hidden", queue.status === "active" ? "bg-gradient-to-r from-[var(--violet)] to-[#EC4899]" : "bg-emerald-500")}
                    >
                      {queue.status === "active" && (
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", transform: "skewX(-20deg)" }} />
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-4 bg-white">
                {queue.bots.map((bot, index) => (
                  <motion.div 
                    key={index} 
                    whileHover={{ scale: bot.status === "running" ? 1.03 : 1.01, x: bot.status === "running" ? 5 : 0 }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-[20px] border transition-all duration-500",
                      bot.status === "completed" 
                        ? "bg-[#FBFAFE] border-slate-100/50 hover:bg-slate-50" 
                        : bot.status === "running"
                        ? "bg-white border-[var(--violet)]/40 shadow-[0_8px_30px_rgba(147,83,245,0.12)] relative overflow-hidden"
                        : "bg-white border-dashed border-slate-200 opacity-50"
                    )}
                  >
                    {bot.status === "running" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--violet)]/5 to-transparent animate-[shimmer_2s_infinite]" />
                    )}
                    <div className="flex flex-col relative z-10">
                      <span className={cn("text-[15px] font-extrabold flex items-center gap-3 tracking-wide", bot.status === "running" ? "text-[var(--violet)]" : "text-[var(--ink)]")}>
                        {bot.status === "running" && <Loader2 className="w-5 h-5 text-[var(--violet)] animate-spin" />}
                        {bot.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        {bot.status === "pending" && <div className="w-2.5 h-2.5 rounded-full bg-slate-300 ml-1.5" />}
                        {bot.name}
                      </span>
                      <span className="text-[13px] text-slate-500 font-bold flex items-center gap-2 mt-2 ml-0.5">
                        <Clock className="w-4 h-4 text-slate-400" /> {bot.timeLabel}
                      </span>
                    </div>
                    {bot.status !== "pending" ? (
                      <div className="text-right flex flex-col items-end relative z-10">
                        <span className={cn("text-[20px] font-black", bot.status === "running" ? "text-[var(--violet)]" : "text-[var(--ink)]")}>{bot.candidates}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mt-1">Processed</span>
                      </div>
                    ) : (
                      <div className="text-[12px] font-black text-slate-400 uppercase tracking-widest relative z-10">Waiting</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
