"use client";

import { useEffect, useState } from "react";
import { User, Search, Activity } from "lucide-react";
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
          <div>
            <h1 className="text-3xl font-bold font-heading tracking-tight text-[var(--ink)] flex items-center gap-3 mb-1">
              Dashboard Overview
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                SYSTEM ONLINE
              </div>
            </h1>
            <p className="text-sm text-muted-foreground mb-2 max-w-xl">
              Welcome back to TalentVerse AI. Monitor your recruitment pipeline, analyze AI candidate metrics, and track your active DCMs in real-time.
            </p>
          </div>
        ) : pathname === "/bot-status" ? (
          <div /> 
        ) : (
          <>
            <h1 className="text-3xl font-bold font-heading text-[var(--ink)] tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mb-2">{pageSubtitle}</p>
          </>
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
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/bot-status')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all text-[13px] font-bold border border-indigo-100 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Live Bot Status
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--violet)] to-[#EC4899] text-white font-semibold text-[13px] shadow-[0_4px_10px_var(--violet-glow)] hover:opacity-90 transition-opacity focus:outline-none">
            {initials || <User className="h-4 w-4 text-white/80" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 bg-card/80 backdrop-blur-xl border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 rounded-[16px] overflow-hidden mt-2" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-3 pt-2 pb-3">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-[14.5px] font-bold tracking-wide text-foreground leading-none">{userName}</p>
                  <p className="text-[12px] font-medium leading-none text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50 mx-2" />
            <DropdownMenuGroup className="px-1 py-1">
              <DropdownMenuItem className="cursor-pointer font-semibold text-[13px] rounded-lg py-2.5 px-3 mb-1 transition-all focus:bg-[var(--violet)]/15 focus:text-[var(--violet)] hover:pl-4" onClick={() => router.push('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-semibold text-[13px] rounded-lg py-2.5 px-3 transition-all focus:bg-[var(--violet)]/15 focus:text-[var(--violet)] hover:pl-4" onClick={() => router.push('/settings')}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50 mx-2" />
            <div className="px-1 pt-1 pb-0.5">
              <DropdownMenuItem className="cursor-pointer font-bold text-[13px] rounded-lg py-2.5 px-3 text-red-500 transition-all focus:bg-red-500/15 focus:text-red-500 hover:pl-4" onClick={handleLogout}>
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
