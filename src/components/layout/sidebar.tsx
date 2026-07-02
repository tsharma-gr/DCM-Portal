"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building,
  BarChart,
  Settings,
  DoorOpen,
  FileText,
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
];

const bottomNavItems = [
  { title: "Reports", href: "/reports", icon: BarChart },
  { title: "Settings", href: "/settings", icon: Settings },
];

import { Suspense } from "react";

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDcmType = searchParams.get("dcmType");

  return (
    <div className="w-[250px] min-w-[250px] bg-card border-r border-border flex flex-col px-4 py-[22px] print:hidden h-full">
      <div className="font-heading font-bold text-[20px] bg-gradient-to-br from-[var(--violet)] to-[#A855F7] bg-clip-text text-transparent px-2 pt-1.5 pb-[26px]">
        TalentVerse AI
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="flex flex-col">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground px-2.5 pt-3.5 pb-2">
              OVERVIEW
            </p>
            <div className="flex flex-col">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href && (item.href !== "/candidates" || !currentDcmType);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5",
                      isActive 
                        ? "bg-gradient-to-br from-[var(--violet)] to-[#9353F5] text-white shadow-[0_6px_16px_var(--violet-glow)]" 
                        : "text-[var(--ink-soft)] hover:bg-[#F4F1FC] hover:text-[var(--ink)]"
                    )}
                  >
                    <item.icon className={cn("w-[18px] text-center", isActive ? "opacity-100" : "opacity-75")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground px-2.5 pt-3.5 pb-2">
              DCM SYSTEMS
            </p>
            <div className="flex flex-col">
              {dcmNavItems.map((item) => {
                const itemDcmType = new URL(item.href, "http://localhost").searchParams.get("dcmType");
                const isActive = pathname === "/candidates" && currentDcmType === itemDcmType;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5",
                      isActive 
                        ? "bg-gradient-to-br from-[var(--violet)] to-[#9353F5] text-white shadow-[0_6px_16px_var(--violet-glow)]" 
                        : "text-[var(--ink-soft)] hover:bg-[#F4F1FC] hover:text-[var(--ink)]"
                    )}
                  >
                    <item.icon className={cn("w-[18px] text-center", isActive ? "opacity-100" : "opacity-75")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto pt-2.5 border-t border-border">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all mb-0.5 text-[var(--ink-soft)] hover:bg-[#F4F1FC] hover:text-[var(--ink)]"
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
