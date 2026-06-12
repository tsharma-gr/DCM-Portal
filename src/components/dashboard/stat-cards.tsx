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
      trend: "+12% from last month",
    },
    {
      title: "FIT Candidates",
      value: stats.fit,
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      trend: "+4% from last week",
    },
    {
      title: "UNFIT Candidates",
      value: stats.unfit,
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      trend: "-2% from last week",
    },
    {
      title: "Processed Today",
      value: stats.processedToday,
      icon: Activity,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      trend: "Real-time updates",
    },
    {
      title: "Active DCMs",
      value: stats.activeDCMs,
      icon: Building2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: "across 2 platforms",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.trend}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
