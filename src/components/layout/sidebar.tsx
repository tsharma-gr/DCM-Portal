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
    <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-xl print:hidden">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          TalentVerse AI
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-6 px-4">
          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Overview
            </p>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href && (item.href !== "/candidates" || !currentDcmType);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              DCM Systems
            </p>
            <div className="space-y-1">
              {dcmNavItems.map((item) => {
                const itemDcmType = new URL(item.href, "http://localhost").searchParams.get("dcmType");
                const isActive = pathname === "/candidates" && currentDcmType === itemDcmType;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      <div className="border-t p-4">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
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
