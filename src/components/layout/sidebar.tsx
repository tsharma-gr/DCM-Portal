"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building,
  Settings,
  DoorOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  List,
  Flame,
  Activity,
} from "lucide-react";

const mainNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Candidates", href: "/candidates", icon: Users },
];

const dcmNavItems = [
  { title: "Exterior DCM", href: "/candidates?dcmType=Exterior", icon: Building },
  { title: "Structural DCM", href: "/candidates?dcmType=Structural", icon: Briefcase },
  { title: "Windows & Doors DCM", href: "/candidates?dcmType=Windows+and+Doors", icon: DoorOpen },
  { title: "BID DCM", href: "/candidates?dcmType=BID", icon: FileText },
  { title: "Estimator DCM", href: "/candidates?dcmType=Estimator", icon: FileText },
  { title: "QS DCM", href: "/candidates?dcmType=QS", icon: Briefcase },
  { title: "Scaffolding DCM", href: "/candidates?dcmType=Scaffolding", icon: Building },
  { title: "Temporary Works DCM", href: "/candidates?dcmType=Temporary+Works+Design", icon: Building },
  { title: "Demolition DCM", href: "/candidates?dcmType=Demolition", icon: Building },
  { title: "Passive Fire DCM", href: "/candidates?dcmType=Passive+Fire+Protection", icon: Flame },
  { title: "Civil & Structural DCM", href: "/candidates?dcmType=Consultancy+Civil+%26+Structural", icon: Building },
];

const bottomNavItems = [
  { title: "Settings", href: "/settings", icon: Settings },
];

import { Suspense } from "react";

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDcmType = searchParams.get("dcmType");
  const [isDcmOpen, setIsDcmOpen] = useState(true);

  return (
    <div className="w-[250px] min-w-[250px] bg-[#16152b] border-none flex flex-col px-4 py-[22px] print:hidden h-full">
      <div className="flex flex-col items-center justify-center pt-2 pb-6 border-b border-white/5 mb-4 px-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="TalentVerse AI Logo" className="h-[64px] w-auto object-contain mb-3 drop-shadow-[0_4px_12px_rgba(147,83,245,0.4)]" />
        <div className="font-heading font-extrabold text-[17px] text-white tracking-[0.08em] uppercase">
          TALENT VERSE AI
        </div>
        <div className="text-[9px] font-bold tracking-[0.12em] text-slate-400 mt-1 uppercase">
          AI Powered Recruitment Services
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 px-2.5 pt-3.5 pb-2 uppercase">
          OVERVIEW
        </p>
        <div className="flex flex-col">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href && (item.href !== "/candidates" || !currentDcmType);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5",
                  isActive 
                    ? "bg-gradient-to-br from-[var(--violet)] to-[#9353F5] text-white shadow-[0_6px_16px_var(--violet-glow)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-[18px] text-center", isActive ? "opacity-100" : "opacity-75")} />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-1">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 px-2.5 pt-3.5 pb-2 uppercase">
          DCM SYSTEMS
        </p>
        <button 
          onClick={() => setIsDcmOpen(!isDcmOpen)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <div className="flex items-center gap-2.5">
            <List className="w-[18px] text-center opacity-75" />
            DCM Systems
          </div>
          {isDcmOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth pb-4">
        <nav className="flex flex-col">
          <AnimatePresence initial={false}>
            {isDcmOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col ml-[21px] pl-4 border-l border-slate-700/50 mt-1 pb-4">
                  {dcmNavItems.map((item) => {
                    const itemDcmType = new URL(item.href, "http://localhost").searchParams.get("dcmType");
                    const isActive = pathname === "/candidates" && currentDcmType === itemDcmType;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13.5px] font-medium transition-all mb-1 relative",
                          isActive 
                            ? "text-white" 
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {isActive && <div className="absolute left-[-17px] top-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-[#9353F5] rounded-r-full" />}
                        <item.icon className={cn("w-[16px] text-center", isActive ? "opacity-100 text-[#9353F5]" : "opacity-60")} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>

      <div className="mt-auto pt-2.5 border-t border-slate-800">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <item.icon className="w-[18px] text-center opacity-75" />
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-xl print:hidden">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">TalentVerse AI</span>
        </div>
      </div>
    }>
      <SidebarContent />
    </Suspense>
  );
}
