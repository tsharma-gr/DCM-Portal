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
  CartesianGrid,
  LineChart,
  Line,
  Legend,
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
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-indigo-500/50"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-lg tracking-wide">Daily Processing Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="FIT" stroke={COLORS.FIT} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="UNFIT" stroke={COLORS.UNFIT} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
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
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/50 shadow-sm print:border-none print:shadow-none relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--violet)]/50 to-pink-500/50"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="font-heading text-lg tracking-wide">Classification Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {classificationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === "FIT" ? COLORS.FIT : entry.name === "UNFIT" ? COLORS.UNFIT : COLORS.Error} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
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
        className="col-span-7 print:w-full print:break-inside-avoid"
      >
        <Card className="bg-card/50 backdrop-blur border-border/50 print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle className="font-heading">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill={COLORS.Primary} radius={[4, 4, 0, 0]}>
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.Primary : COLORS.Secondary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
