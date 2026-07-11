"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Candidate } from "@/types/candidate";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Legend,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

interface ChartsProps {
  data: Pick<Candidate, "classification" | "platform_name" | "dcm_type" | "processed_timestamp">[];
}

const COLORS = {
  FIT: "#2FB865",
  UNFIT: "#E5484D",
  Error: "#E9A23B",
  Primary: "#7C3AED",
  Secondary: "#EC4899",
};

export function DashboardCharts({ data }: ChartsProps) {
  // Process Classification Data
  const classificationData = useMemo(() => {
    const counts = data.reduce(
      (acc, curr) => {
        const cls = curr.classification || "Error";
        acc[cls] = (acc[cls] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Process Platform Data
  const platformData = useMemo(() => {
    const counts = data.reduce(
      (acc, curr) => {
        const plat = curr.platform_name || "Unknown";
        acc[plat] = (acc[plat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.entries(counts)
      .filter(([name]) => name && name !== "N/A" && name !== "Unknown")
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [data]);

  // Process Trend Data (Last 7 days)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; FIT: number; UNFIT: number }> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days[dateStr] = { date: dateStr, FIT: 0, UNFIT: 0 };
    }

    data.forEach((curr) => {
      if (!curr.processed_timestamp) return;
      const dateStr = curr.processed_timestamp.split("T")[0];
      if (days[dateStr]) {
        if (curr.classification === "FIT") days[dateStr].FIT += 1;
        if (curr.classification === "UNFIT") days[dateStr].UNFIT += 1;
      }
    });

    return Object.values(days).map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'Europe/London' })
    }));
  }, [data]);

  // Process DCM Distribution Data for Treemap
  const dcmData = useMemo(() => {
    const counts = data.reduce(
      (acc, curr) => {
        const dcm = curr.dcm_type || "Unknown";
        acc[dcm] = (acc[dcm] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const vibrantColors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#3B82F6", "#60A5FA", "#EC4899", "#F472B6", "#10B981", "#34D399", "#F59E0B"];
    return Object.entries(counts)
      .filter(([name]) => name && name !== "N/A" && name !== "Unknown")
      .map(([name, value]) => ({ name, size: value }))
      .sort((a, b) => b.size - a.size)
      .map((item, index) => ({
        ...item,
        fill: vibrantColors[index % vibrantColors.length]
      }));
  }, [data]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 print:flex print:flex-col print:gap-8 print:w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="col-span-4 print:w-full print:break-inside-avoid"
      >
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500/80 to-indigo-500/80"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-[17px] font-extrabold tracking-tight text-[var(--ink)]">Daily Processing Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorFIT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.FIT} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.FIT} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUNFIT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.UNFIT} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.UNFIT} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--ink)' }}
                    cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                  <Area type="monotone" dataKey="FIT" stroke={COLORS.FIT} strokeWidth={3} fillOpacity={1} fill="url(#colorFIT)" activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.FIT }} />
                  <Area type="monotone" dataKey="UNFIT" stroke={COLORS.UNFIT} strokeWidth={3} fillOpacity={1} fill="url(#colorUNFIT)" activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.UNFIT }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="col-span-3 print:w-full print:break-inside-avoid"
      >
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500/80 to-rose-500/80"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-[17px] font-extrabold tracking-tight text-[var(--ink)]">Classification Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {classificationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === "FIT" ? COLORS.FIT : entry.name === "UNFIT" ? COLORS.UNFIT : COLORS.Error} 
                        style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--ink)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="col-span-4 print:w-full print:break-inside-avoid"
      >
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400/80 to-orange-500/80"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-[17px] font-extrabold tracking-tight text-[var(--ink)]">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--ink)' }}
                  />
                  <Bar dataKey="value" fill={COLORS.Primary} radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.Primary : COLORS.Secondary} style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.05))' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="col-span-3 print:w-full print:break-inside-avoid"
      >
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400/80 to-teal-500/80"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-[17px] font-extrabold tracking-tight text-[var(--ink)]">DCM Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pr-2">
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 h-[250px] custom-scrollbar">
                  {dcmData.map((dcm, index) => (
                    <motion.div 
                      key={dcm.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index, ease: "easeOut" }}
                      className="flex flex-col gap-1.5 group"
                    >
                      <div className="flex justify-between items-center text-[12px] font-semibold">
                        <span className="text-[var(--ink)] group-hover:text-[var(--violet)] transition-colors">{dcm.name}</span>
                        <span className="text-slate-500 font-mono">{dcm.size.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, (dcm.size / dcmData[0].size) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 + (0.1 * index), ease: [0.25, 0.1, 0.25, 1] }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: dcm.fill }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
