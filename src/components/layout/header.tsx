"use client";

import { useEffect, useState } from "react";
import { User, Search, Settings, LogOut, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("Loading...");
  const [userName, setUserName] = useState<string>("Loading...");

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "No email");
        const fallbackName = user.email ? user.email.split('@')[0] : "User";
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || fallbackName);
      } else {
        setUserEmail("Not logged in");
        setUserName("Guest");
      }
    }
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    toast.dismiss();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = userName === "Loading..." ? "" : userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Sync search query with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Push search changes to URL
  useEffect(() => {
    if (pathname !== "/candidates") return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      if (searchParams.get("search") !== searchQuery && (searchQuery !== "" || searchParams.has("search"))) {
        router.push(`/candidates?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, pathname, router, searchParams]);

  let pageTitle = "Overview";
  let pageSubtitle = "Monitor your AI recruitment pipeline and candidate metrics.";
  
  if (pathname.includes("/candidates")) {
    pageTitle = "Candidates";
    pageSubtitle = "Review and manage parsed candidates from the AI pipeline.";
  } else if (pathname.includes("/settings")) {
    pageTitle = "Settings";
    pageSubtitle = "Manage your account preferences and application settings.";
  } else if (pathname.includes("/profile")) {
    pageTitle = "Profile";
    pageSubtitle = "Manage your personal profile and preferences.";
  } else if (pathname.includes("/reports")) {
    pageTitle = "Reports & Analytics";
    pageSubtitle = "Generate and download comprehensive recruitment performance reports.";
  }

  return (
    <header className="flex min-h-[72px] shrink-0 items-start justify-between bg-transparent px-8 pt-8 pb-2 print:hidden">
      <div className="flex flex-col flex-1 gap-1">
        {pathname === "/" ? (
          <div className="animate-in slide-in-from-left-2 duration-700 ease-out">
            <h1 className="text-3xl font-extrabold font-heading tracking-tight mb-1 bg-gradient-to-r from-[var(--ink)] via-[var(--violet)] to-[var(--ink)] bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-2 max-w-xl">
              Welcome back to TalentVerse AI.
            </p>
          </div>
        ) : pathname === "/bot-status" || pathname === "/bot-analytics" ? (
          <div /> 
        ) : (
          <div className="animate-in slide-in-from-left-2 duration-700 ease-out">
            <h1 className="text-3xl font-extrabold font-heading tracking-tight mb-1 bg-gradient-to-r from-[var(--ink)] via-[var(--violet)] to-[var(--ink)] bg-clip-text text-transparent">
              {pageTitle}
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-2">{pageSubtitle}</p>
          </div>
        )}
        
        {pathname.includes("/candidates") && (
          <div className="relative w-[350px] mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search candidates..."
              className="pl-9 h-[42px] rounded-[10px] border border-border bg-white shadow-sm text-[13.5px] focus-visible:ring-[var(--violet)] focus-visible:ring-offset-0 transition-all focus-within:border-[var(--violet)] focus-within:shadow-[0_0_0_3px_var(--violet-glow)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 mt-1">
        <div className="flex items-center gap-5">
        <button 
          onClick={() => router.push('/bot-status')}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 text-[12.5px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Bot Status
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--violet)] to-[#EC4899] text-white font-semibold text-[13px] shadow-[0_4px_10px_var(--violet-glow)] hover:opacity-90 transition-opacity focus:outline-none">
            {initials || <User className="h-4 w-4 text-white/80" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-slate-200 shadow-xl p-1.5 rounded-[12px] overflow-hidden mt-2" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2.5 pt-2 pb-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-[13.5px] font-bold text-slate-900 tracking-tight">{userName}</p>
                  <p className="text-[12px] font-medium text-slate-500 truncate">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 mx-1 mb-1" />
            <DropdownMenuGroup className="px-1">
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2.5 font-medium text-[13px] text-slate-700 rounded-md py-2 px-2.5 mb-0.5 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900" onClick={() => router.push('/profile')}>
                <User className="h-4 w-4 text-slate-400" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2.5 font-medium text-[13px] text-slate-700 rounded-md py-2 px-2.5 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 mx-1 my-1" />
            <div className="px-1 pb-1">
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2.5 font-medium text-[13px] text-red-600 rounded-md py-2 px-2.5 transition-colors hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700" onClick={handleLogout}>
                <LogOut className="h-4 w-4 text-red-500/70" />
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
