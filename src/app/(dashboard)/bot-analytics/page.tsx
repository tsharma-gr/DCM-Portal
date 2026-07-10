"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Activity, Clock, Calendar, Server, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

type DCMStat = {
  dcmType: string;
  count: number;
  earliestTs: number;
  latestTs: number;
  durationMs: number;
};

type DailyStats = {
  dateStr: string;
  totalCvs: number;
  dcms: DCMStat[];
};

export default function BotAnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(7);

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    const fetchHistoricalData = async () => {
      setIsLoading(true);
      
      // Delay the heavy fetch slightly to allow the framer-motion UI animation to complete smoothly
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!isActive) return;

      try {
        // Look back based on timeRange
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);
        startDate.setHours(0, 0, 0, 0);
        const startIso = startDate.toISOString();

        const allData: { dcm_type: string; processed_timestamp: string }[] = [];
        let from = 0;
        const step = 1000;
        
        while (isActive) {
          const { data, error } = await supabase
            .from("candidates")
            .select("dcm_type, processed_timestamp")
            .gte("processed_timestamp", startIso)
            .order("processed_timestamp", { ascending: false })
            .range(from, from + step - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          // Push is much faster than concat for large arrays
          allData.push(...data);
          
          if (data.length < step) break;
          from += step;
        }

        if (!isActive) return;

        // Group by Date String (YYYY-MM-DD)
        const groupedByDate: Record<string, Record<string, { count: number, earliestTs: number, latestTs: number }>> = {};

        // Process in chunks to avoid blocking the main UI thread during massive loops (e.g., 1 Year of data)
        const processChunk = (startIdx: number) => {
          const chunkEnd = Math.min(startIdx + 5000, allData.length);
          for (let i = startIdx; i < chunkEnd; i++) {
            const row = allData[i];
            if (!row.processed_timestamp) continue;
            const ts = new Date(row.processed_timestamp);
            const dateStr = ts.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
            const rowTime = ts.getTime();

            if (!groupedByDate[dateStr]) groupedByDate[dateStr] = {};

            const dcmType = row.dcm_type || "Unknown";
            if (!groupedByDate[dateStr][dcmType]) {
              groupedByDate[dateStr][dcmType] = { count: 0, earliestTs: Infinity, latestTs: 0 };
            }

            groupedByDate[dateStr][dcmType].count += 1;
            if (rowTime > groupedByDate[dateStr][dcmType].latestTs) {
              groupedByDate[dateStr][dcmType].latestTs = rowTime;
            }
            if (rowTime < groupedByDate[dateStr][dcmType].earliestTs) {
              groupedByDate[dateStr][dcmType].earliestTs = rowTime;
            }
          }

          if (chunkEnd < allData.length) {
            // Give UI a frame to breathe, then process next chunk
            requestAnimationFrame(() => processChunk(chunkEnd));
          } else {
            finalizeData();
          }
        };

        const finalizeData = () => {
          if (!isActive) return;
          const parsedData: DailyStats[] = [];
          for (const [dateStr, dcmObj] of Object.entries(groupedByDate)) {
            let dailyTotal = 0;
            const dcms: DCMStat[] = [];
            for (const [dcmType, stats] of Object.entries(dcmObj)) {
              dailyTotal += stats.count;
              let durationMs = stats.latestTs - stats.earliestTs;
              if (durationMs === 0 && stats.count > 0) durationMs = 60000; 

              dcms.push({
                dcmType,
                count: stats.count,
                earliestTs: stats.earliestTs,
                latestTs: stats.latestTs,
                durationMs
              });
            }
            dcms.sort((a, b) => a.earliestTs - b.earliestTs);

            parsedData.push({
              dateStr,
              totalCvs: dailyTotal,
              dcms
            });
          }

          parsedData.sort((a, b) => b.dcms[0]?.earliestTs - a.dcms[0]?.earliestTs);

          setDailyStats(parsedData);
          setIsLoading(false);
        };

        // Start processing
        if (allData.length > 0) {
          processChunk(0);
        } else {
          setDailyStats([]);
          setIsLoading(false);
        }

      } catch (err) {
        console.error("Failed to fetch historical stats:", err);
        if (isActive) setIsLoading(false);
      }
    };

    fetchHistoricalData();
    return () => { isActive = false; };
  }, [timeRange]);

  const formatTime = (ts: number) => {
    if (!ts || ts === Infinity) return "--:--";
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "0m";
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${minutes}m`;
  };

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
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex flex-col relative z-10">
            <h1 className="text-[28px] font-extrabold tracking-tight flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 rounded-xl" />
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg relative z-10">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ink)] to-slate-500">
                Historical Bot Analytics
              </span>
            </h1>
            <p className="text-[14px] text-slate-500 mt-2 font-medium tracking-wide">Review exact run times and durations over the last {timeRange} days to balance queues.</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 bg-white p-1.5 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200">
            {[7, 15, 30, 365].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={cn(
                  "relative px-4 py-2 rounded-[12px] text-[13px] font-bold transition-colors z-10",
                  timeRange === days
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {timeRange === days && (
                  <motion.div
                    layoutId="activeTimeRange"
                    className="absolute inset-0 bg-blue-600 rounded-[12px] shadow-md z-[-1]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {days === 365 ? "1 Year" : `${days} Days`}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-500 font-medium">Crunching {timeRange === 365 ? "1 year" : `${timeRange} days`} of historical data...</span>
          </div>
        ) : dailyStats.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white rounded-[24px] border border-slate-100">
            No historical data found.
          </div>
        ) : (
          <div className="space-y-10">
            {dailyStats.map((day) => (
              <motion.div 
                key={day.dateStr} 
                variants={itemVariants}
                className="bg-white rounded-[32px] border border-slate-100/50 shadow-sm overflow-hidden"
              >
                <div className="px-8 py-5 border-b border-slate-100 bg-[#FBFAFE] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[var(--ink)]">{day.dateStr}</h2>
                      <p className="text-[13px] text-slate-500 font-semibold">{day.totalCvs} total candidates processed</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[12px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="pb-4 pl-4 font-extrabold">DCM Node</th>
                          <th className="pb-4 text-center">CVs Processed</th>
                          <th className="pb-4">Start Time</th>
                          <th className="pb-4">End Time</th>
                          <th className="pb-4 pr-4 text-right">Total Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {day.dcms.map((dcm, dcmIdx) => (
                          <tr key={dcmIdx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pl-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                  <Server className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-[14px] text-[var(--ink)]">{dcm.dcmType}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[13px]">
                                {dcm.count}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2 text-slate-600 font-medium text-[14px]">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {formatTime(dcm.earliestTs)}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2 text-slate-600 font-medium text-[14px]">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {formatTime(dcm.latestTs)}
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-right">
                              <span className="font-extrabold text-[14px] text-blue-600">
                                {formatDuration(dcm.durationMs)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
