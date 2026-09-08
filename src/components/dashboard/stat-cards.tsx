"use client";

import { Users, UserCheck, UserX, Activity, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateStats } from "@/types/candidate";
import { motion } from "framer-motion";

interface StatCardsProps {
  stats: CandidateStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: "Total Candidates",
      value: stats.total,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: stats.trends?.total || "Calculating...",
    },
    {
      title: "FIT Candidates",
      value: stats.fit,
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      trend: stats.trends?.fit || "Calculating...",
    },
    {
      title: "UNFIT Candidates",
      value: stats.unfit,
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      trend: stats.trends?.unfit || "Calculating...",
    },
    {
      title: "Processed Today",
      value: stats.processedToday,
      icon: Activity,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      trend: stats.trends?.processedToday || "Real-time updates",
    },
    {
      title: "Active DCMs",
      value: stats.activeDCMs,
      icon: Building2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: stats.trends?.activeDCMs || "across platforms",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={index === 4 ? "col-span-2 sm:col-span-1" : ""}
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-card/60 backdrop-blur-md border-border/50 group h-full">
            {/* Subtle top border gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity ${
              index === 0 ? "from-blue-500 to-indigo-500" :
              index === 1 ? "from-emerald-400 to-emerald-600" :
              index === 2 ? "from-red-400 to-rose-600" :
              index === 3 ? "from-amber-400 to-orange-500" :
              "from-purple-500 to-[#9353F5]"
            }`}></div>
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-3.5 sm:px-6 sm:pt-5 sm:pb-3">
              <CardTitle className="text-[12px] sm:text-[13.5px] font-medium text-muted-foreground tracking-wide line-clamp-1">
                {card.title}
              </CardTitle>
              <div className={`p-2 sm:p-2.5 rounded-xl ${card.bgColor} shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-3.5 pb-4 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">{card.value}</div>
              <p className="text-[10.5px] sm:text-[11.5px] text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-1.5 font-medium truncate">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  card.trend.includes("+") ? "bg-emerald-500" : 
                  card.trend.includes("-") ? "bg-red-500" : 
                  "bg-blue-500"
                }`}></span>
                <span className="truncate">{card.trend}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

