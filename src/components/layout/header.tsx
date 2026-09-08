"use client";

import { useEffect, useState } from "react";
import { User, Search, Settings, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("Loading...");
  const [userName, setUserName] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
      setIsLoading(false);
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

  // Determine greeting based on UK time
  const getGreeting = () => {
    const ukTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/London', hour: 'numeric', hour12: false });
    const hour = parseInt(ukTimeStr, 10);
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const greeting = getGreeting();

  let pageTitle = "Dashboard Overview";
  let pageSubtitle = "Welcome back to TalentVerse AI.";
  
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
    <header className="flex min-h-[64px] shrink-0 flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 bg-transparent px-3 sm:px-6 lg:px-8 pt-3 sm:pt-8 pb-2 print:hidden">
      <div className="flex flex-col flex-1 gap-1">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="block lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger className="p-2 -ml-1 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm hover:bg-slate-100 transition-colors text-slate-700 focus:outline-none">
                  <Menu className="w-5 h-5 text-[var(--violet)]" />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px] border-none bg-[#16152b]">
                  <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 w-48 bg-slate-200 rounded mb-1"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
              </div>
            ) : pathname === "/" ? (
              <div className="animate-in slide-in-from-left-2 duration-700 ease-out">
                <h1 className="text-[20px] sm:text-3xl font-extrabold font-heading tracking-tight mb-0.5 bg-gradient-to-r from-[var(--ink)] via-[var(--violet)] to-[var(--ink)] bg-clip-text text-transparent leading-tight">
                  {greeting}, {userName.charAt(0).toUpperCase() + userName.slice(1)}
                </h1>
                <p className="text-[12px] sm:text-sm font-medium text-slate-500 hidden xs:block">
                  Welcome back to TalentVerse AI.
                </p>
              </div>
            ) : pathname === "/bot-status" || pathname === "/bot-analytics" ? (
              <div /> 
            ) : (
              <div className="animate-in slide-in-from-left-2 duration-700 ease-out">
                <h1 className="text-[20px] sm:text-3xl font-extrabold font-heading tracking-tight mb-0.5 bg-gradient-to-r from-[var(--ink)] via-[var(--violet)] to-[var(--ink)] bg-clip-text text-transparent leading-tight">
                  {pageTitle}
                </h1>
                <p className="text-[12px] sm:text-sm font-medium text-slate-500 hidden xs:block">{pageSubtitle}</p>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex sm:hidden items-center gap-2.5">
            <button 
              onClick={() => router.push('/bot-status')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-bold"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--violet)] to-[#EC4899] text-white font-semibold text-[12px] shadow-sm focus:outline-none">
                {initials || <User className="h-3.5 w-3.5 text-white/80" />}
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
        
        {pathname.includes("/candidates") && (
          <div className="relative w-full sm:w-[350px] mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search candidates..."
              className="pl-9 h-[40px] sm:h-[42px] rounded-[10px] border border-border bg-white shadow-sm text-[13.5px] focus-visible:ring-[var(--violet)] focus-visible:ring-offset-0 transition-all focus-within:border-[var(--violet)] focus-within:shadow-[0_0_0_3px_var(--violet-glow)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      
      {/* Desktop Right Controls */}
      <div className="hidden sm:flex items-center gap-6 mt-1">
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

