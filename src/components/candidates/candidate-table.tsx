"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, MoreHorizontal, Eye, Trash, MessageSquare, Download, CheckSquare, Loader2, Check, X, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface CandidateTableProps {
  candidates: Candidate[];
  totalCount: number;
}

export function CandidateTable({ candidates: initialCandidates, totalCount }: CandidateTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const lastPushedSearch = useRef(searchParams.get("search") || "");
  const [classification, setClassification] = useState(searchParams.get("classification") || "All");
  const [dcmType, setDcmType] = useState(searchParams.get("dcmType") || "All");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "All");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [limit, setLimit] = useState(searchParams.get("limit") || "10");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Sync external URL changes (like Sidebar clicks) to local state
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // Only overwrite search input if URL changed externally
    if (urlSearch !== lastPushedSearch.current) {
      setSearch(urlSearch);
      setSearchInput(urlSearch);
      lastPushedSearch.current = urlSearch;
    }
    setClassification(searchParams.get("classification") || "All");
    setDcmType(searchParams.get("dcmType") || "All");
    setPlatform(searchParams.get("platform") || "All");
    setDate(searchParams.get("date") || "");
    setLimit(searchParams.get("limit") || "10");
    setPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchInput, search]);

  // Keep a ref to the latest filters so the WebSocket callback can access them
  const filtersRef = useRef({ search, classification, dcmType, platform, date });
  useEffect(() => {
    filtersRef.current = { search, classification, dcmType, platform, date };
  }, [search, classification, dcmType, platform, date]);
  
  // Local state for optimistic updates
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [localTotalCount, setLocalTotalCount] = useState(totalCount);

  // Restore scroll position when returning from candidate details
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem("candidatesScrollY");
    if (savedScrollY && candidates.length > 0) {
      const targetY = parseInt(savedScrollY, 10);
      
      // Force scroll position for a brief period to override Next.js layout shifts
      let attempts = 0;
      const interval = setInterval(() => {
        window.scrollTo({ top: targetY, behavior: "instant" });
        attempts++;
        if (attempts >= 8) { // 800ms total
          clearInterval(interval);
          sessionStorage.removeItem("candidatesScrollY");
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [candidates]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkCustomStatus, setShowBulkCustomStatus] = useState(false);
  const [bulkCustomStatus, setBulkCustomStatus] = useState("");

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length && candidates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    if (newStatus === "Other") {
      setShowBulkCustomStatus(true);
      return;
    }
    setIsBulkUpdating(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.bulkUpdateCandidates(Array.from(selectedIds), { status: newStatus });
      setCandidates(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status: newStatus } : c));
      setSelectedIds(new Set());
      router.refresh();
      toast.success(`Updated ${selectedIds.size} candidates to ${newStatus}`);
    } catch (error) {
      console.error("Bulk update failed:", error);
      toast.error("Failed to update candidates");
    } finally {
      setIsBulkUpdating(false);
      setShowBulkCustomStatus(false);
      setBulkCustomStatus("");
    }
  };

  const handleApplyBulkCustomStatus = () => {
    if (!bulkCustomStatus.trim()) return;
    handleBulkStatusUpdate(bulkCustomStatus.trim());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} candidates?`)) return;
    setIsBulkUpdating(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.bulkDeleteCandidates(Array.from(selectedIds));
      setCandidates(prev => prev.filter(c => !selectedIds.has(c.id)));
      setLocalTotalCount(prev => Math.max(0, prev - selectedIds.size));
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      console.error("Failed to bulk delete", err);
      alert("Failed to delete candidates.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportCSV = () => {
    if (!candidates.length) return;
    const headers = ["ID", "Name", "Position", "Job Title", "Desired Role", "Classification", "Status", "Location", "AI Reasoning", "DCM Type", "CV Link", "Date Processed", "Platform"];
    const csvRows = candidates.map(c => [
      c.id,
      `"${(c.candidate_name || '').replace(/"/g, '""')}"`,
      `"${(c.current_position || '').replace(/"/g, '""')}"`,
      `"${(c.job_title || '').replace(/"/g, '""')}"`,
      `"${(c.desired_role || '').replace(/"/g, '""')}"`,
      c.classification || '',
      c.status || '',
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${(c.ai_reasoning || '').replace(/"/g, '""')}"`,
      c.dcm_type || '',
      `"${(c.cv_link || '').replace(/"/g, '""')}"`,
      new Date(c.processed_timestamp).toISOString(),
      c.platform_name || ''
    ].join(","));
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync when server data changes
  useEffect(() => {
    setCandidates(initialCandidates);
    setLocalTotalCount(totalCount);
  }, [initialCandidates, totalCount]);

  // True Realtime WebSocket Subscription
  useEffect(() => {
    const initRealtime = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      console.log("Initializing Supabase Realtime for CandidateTable...");

      // Use a random channel name to prevent "already subscribed" errors during Fast Refresh
      const channelName = `candidates-realtime-${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'candidates' },
          (payload) => {
            console.log("REALTIME INSERT RECEIVED:", payload);
            const newCandidate = payload.new as Candidate;
            const filters = filtersRef.current;

            // Check if the new candidate matches the currently active filters
            if (filters.classification !== "All" && newCandidate.classification !== filters.classification) return;
            if (filters.dcmType !== "All" && newCandidate.dcm_type !== filters.dcmType) return;
            if (filters.platform !== "All" && !newCandidate.platform_name?.toLowerCase().includes(filters.platform.toLowerCase())) return;
            if (filters.search && !newCandidate.candidate_name?.toLowerCase().includes(filters.search.toLowerCase())) return;
            if (filters.date) {
               const newDate = new Date(newCandidate.processed_timestamp).toISOString().split('T')[0];
               if (newDate !== filters.date) return;
            }

            // Instantly add to top of table
            setCandidates(prev => [newCandidate, ...prev]);
            setLocalTotalCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'candidates' },
          (payload) => {
            console.log("REALTIME UPDATE RECEIVED:", payload);
            const updated = payload.new as Candidate;
            setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'candidates' },
          (payload) => {
            console.log("REALTIME DELETE RECEIVED:", payload);
            setCandidates(prev => prev.filter(c => c.id !== payload.old.id));
            setLocalTotalCount(prev => Math.max(0, prev - 1));
          }
        )
        .subscribe((status, err) => {
          console.log("REALTIME SUBSCRIPTION STATUS:", status, err);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanupPromise = initRealtime();
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []);

  // Restore scroll position aggressively when candidates load
  useEffect(() => {
    if (candidates.length > 0) {
      const savedScrollY = sessionStorage.getItem("candidatesScrollY");
      if (savedScrollY) {
        const y = parseInt(savedScrollY, 10);
        
        // Next.js resets scroll position in multiple ticks during navigation.
        // We force the scroll position multiple times to fight it.
        const restore = () => window.scrollTo({ top: y, behavior: 'instant' });
        
        restore();
        const t1 = setTimeout(restore, 50);
        const t2 = setTimeout(restore, 100);
        const t3 = setTimeout(restore, 300);
        const t4 = setTimeout(restore, 500);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    }
  }, [candidates.length]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (classification && classification !== "All") params.set("classification", classification);
    if (dcmType && dcmType !== "All") params.set("dcmType", dcmType);
    if (platform && platform !== "All") params.set("platform", platform);
    if (date) params.set("date", date);
    if (limit && limit !== "10") params.set("limit", limit);
    if (page > 1) params.set("page", page.toString());
    
    lastPushedSearch.current = search;
    router.replace(`/candidates?${params.toString()}`, { scroll: false });
  }, [search, classification, dcmType, platform, date, limit, page, router]);

  const getClassificationBadge = (c: string) => {
    const cls = c?.toLowerCase() || 'error';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold tracking-[0.02em] ${
        cls === 'fit' ? 'bg-[var(--fit-bg)] text-[var(--fit-fg)]' : 
        cls === 'unfit' ? 'bg-[var(--unfit-bg)] text-[var(--unfit-fg)]' : 
        'bg-[var(--error-bg)] text-[var(--error-fg)]'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          cls === 'fit' ? 'bg-[var(--fit-dot)]' : 
          cls === 'unfit' ? 'bg-[var(--unfit-dot)]' : 
          'bg-[var(--error-dot)]'
        }`}></span>
        {c || "ERROR"}
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const isNew = status === "New" || !status;
    if (isNew) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold tracking-[0.02em] bg-[var(--new-bg)] text-[var(--new-fg)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--new-dot)]"></span>
          NEW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold tracking-[0.02em] bg-[var(--review-bg)] text-[var(--review-fg)] uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--review-dot)]"></span>
        {status}
      </span>
    );
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent navigation
    if (confirm("Are you sure you want to delete this candidate?")) {
      // Optimistic UI Update: instantly remove it from the screen
      setCandidates(prev => prev.filter(c => c.id !== id));
      setLocalTotalCount(prev => Math.max(0, prev - 1));
      try {
        const { candidateService } = await import("@/services/candidateService");
        await candidateService.deleteCandidate(id);
        router.refresh();
      } catch (err) {
        // Revert on error
        setCandidates(initialCandidates);
        setLocalTotalCount(totalCount);
        console.error("Failed to delete candidate", err);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-[26px] font-bold font-heading tracking-[-0.02em]">Candidates</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            Review and manage parsed candidates from the AI pipeline.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-[12px] mb-[20px] flex-wrap">
        <div className="flex-1 min-w-[220px] flex items-center gap-[8px] bg-card border border-border rounded-[10px] p-[10px_14px] transition-all focus-within:border-[var(--violet)] focus-within:shadow-[0_0_0_3px_var(--violet-glow)]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search candidates..."
            className="border-none outline-none text-[13.5px] w-full bg-transparent font-inherit text-foreground"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap w-full sm:w-auto gap-[12px] items-center">
          <Select value={classification} onValueChange={(v) => { if (v) { setClassification(v); setPage(1); } }}>
            <SelectTrigger className="border border-border bg-card rounded-[10px] px-3 py-2.5 h-auto text-[13.5px] text-[var(--ink-soft)] hover:border-[#CFC9EA] transition-colors cursor-pointer focus:ring-0">
              <span className="font-medium mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="FIT">FIT</SelectItem>
              <SelectItem value="UNFIT">UNFIT</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dcmType} onValueChange={(v) => { if (v) { setDcmType(v); setPage(1); } }}>
            <SelectTrigger className="border border-border bg-card rounded-[10px] px-3 py-2.5 h-auto text-[13.5px] text-[var(--ink-soft)] hover:border-[#CFC9EA] transition-colors cursor-pointer focus:ring-0">
              <span className="font-medium mr-1">DCM:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Exterior">Exterior</SelectItem>
              <SelectItem value="Structural">Structural</SelectItem>
              <SelectItem value="Windows and Doors">Windows and Doors</SelectItem>
              <SelectItem value="BID">BID</SelectItem>
              <SelectItem value="Estimator">Estimator</SelectItem>
              <SelectItem value="QS">QS</SelectItem>
              <SelectItem value="Scaffolding">Scaffolding</SelectItem>
              <SelectItem value="Temporary Works Design">Temporary Works Design</SelectItem>
              <SelectItem value="Demolition">Demolition</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={(v) => { if (v) { setPlatform(v); setPage(1); } }}>
            <SelectTrigger className="border border-border bg-card rounded-[10px] px-3 py-2.5 h-auto text-[13.5px] text-[var(--ink-soft)] hover:border-[#CFC9EA] transition-colors cursor-pointer focus:ring-0">
              <span className="font-medium mr-1">Platform:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="CV-Library">CV-Library</SelectItem>
              <SelectItem value="Totaljobs">Totaljobs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit} onValueChange={(v) => { if (v) { setLimit(v); setPage(1); } }}>
            <SelectTrigger className="border border-border bg-card rounded-[10px] px-3 py-2.5 h-auto text-[13.5px] text-[var(--ink-soft)] hover:border-[#CFC9EA] transition-colors cursor-pointer focus:ring-0">
              <SelectValue placeholder="Per Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex items-center">
            <Input 
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-[140px] bg-background/50 border-border/50 text-muted-foreground pr-8 [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                if (date) {
                  e.preventDefault();
                  setDate("");
                  setPage(1);
                } else {
                  dateInputRef.current?.showPicker();
                }
              }}
              className={`absolute right-0 h-9 w-9 shrink-0 ${date ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:text-foreground'}`}
              title={date ? "Clear date filter" : "Select date"}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          <button onClick={handleExportCSV} className="flex items-center gap-[8px] bg-[var(--ink)] text-white border-none rounded-[10px] p-[10px_16px] text-[13.5px] font-semibold font-inherit cursor-pointer transition-all hover:bg-[var(--violet-deep)] hover:-translate-y-[1px]">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[var(--new-bg)] border border-[#D5C2FE] rounded-[12px] p-[12px_20px] shadow-[0_4px_20px_var(--violet-glow)] mb-[20px] gap-4"
        >
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] bg-[var(--violet)] text-white shadow-sm">
              <CheckSquare className="h-[14px] w-[14px]" />
            </div>
            <span className="font-semibold text-[14px] text-[var(--violet-deep)]">{selectedIds.size} candidates selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-[12px]">
            {showBulkCustomStatus ? (
              <div className="flex items-center gap-[8px]">
                <Input 
                  value={bulkCustomStatus} 
                  onChange={e => setBulkCustomStatus(e.target.value)} 
                  placeholder="Others" 
                  className="h-[36px] w-[150px] text-[13px] bg-white border border-[#D5C2FE] rounded-[8px] focus-visible:ring-[var(--violet)]"
                  onKeyDown={e => e.key === 'Enter' && handleApplyBulkCustomStatus()}
                  autoFocus
                />
                <button className="h-[36px] w-[36px] flex items-center justify-center bg-white border border-[#D5C2FE] rounded-[8px] text-[var(--violet)] hover:bg-[var(--violet-glow)] transition-colors" onClick={handleApplyBulkCustomStatus} disabled={isBulkUpdating}>
                  {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button className="h-[36px] w-[36px] flex items-center justify-center text-muted-foreground hover:text-[var(--ink)] transition-colors" onClick={() => setShowBulkCustomStatus(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Select onValueChange={(v: string | null) => { if (v) handleBulkStatusUpdate(v); }} disabled={isBulkUpdating}>
                <SelectTrigger className="h-[36px] w-[160px] bg-white border border-[#D5C2FE] text-[13px] font-medium text-[var(--ink-soft)] rounded-[8px] focus:ring-[var(--violet)] focus:ring-offset-0">
                  <SelectValue placeholder="Change Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Opened">Opened</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
            <button onClick={handleBulkDelete} disabled={isBulkUpdating} className="h-[36px] flex items-center gap-[6px] px-[14px] bg-[var(--error-bg)] text-[var(--error-fg)] border border-[var(--error-dot)]/20 rounded-[8px] text-[13px] font-semibold transition-all hover:bg-[var(--error-dot)] hover:text-white disabled:opacity-50">
              {isBulkUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
              Delete Selected
            </button>
          </div>
        </motion.div>
      )}

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(20,15,50,0.03)] flex flex-col"
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse min-w-[920px]">
            <thead>
              <tr>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border pl-[20px] w-[36px]">
                  <input 
                    type="checkbox" 
                    className="w-[16px] h-[16px] accent-[var(--violet)] cursor-pointer" 
                    checked={candidates.length > 0 && selectedIds.size === candidates.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Candidate</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Location</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Classification</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Status</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Platform</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border">Processed</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-right text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border pr-[20px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-32 text-center text-[13.5px] text-muted-foreground align-middle">
                    No candidates found matching your criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate, i) => {
                  const avatarColors = ["var(--avatar-a)","var(--avatar-b)","var(--avatar-c)","var(--avatar-d)","var(--avatar-e)"];
                  const color = avatarColors[i % avatarColors.length];
                  const initials = candidate.candidate_name ? candidate.candidate_name.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase() : "??";
                  
                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-border relative transition-colors duration-150 hover:bg-[#FBFAFF] cursor-pointer group"
                      onClick={() => {
                        sessionStorage.setItem("candidatesScrollY", window.scrollY.toString());
                        router.push(`/candidates/${candidate.id}`);
                      }}
                    >
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle pl-[20px] w-[36px] relative" onClick={(e) => e.stopPropagation()}>
                        {/* Left accent on hover based on classification */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: candidate.classification?.toLowerCase() === 'fit' ? 'var(--fit-dot)' : 'var(--unfit-dot)' }}></div>
                        <input 
                          type="checkbox" 
                          className="w-[16px] h-[16px] accent-[var(--violet)] cursor-pointer" 
                          checked={selectedIds.has(candidate.id)}
                          onChange={() => toggleSelect(candidate.id)}
                        />
                      </td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle">
                        <div className="flex items-center gap-[11px] font-semibold text-[var(--ink)]">
                          <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: color }}>
                            {initials}
                          </div>
                          {candidate.candidate_name}
                        </div>
                      </td>
                      <td className={`px-[18px] py-[13px] text-[13.5px] align-middle ${!candidate.location || candidate.location === 'Unknown' ? 'text-muted-foreground italic' : 'text-[var(--ink-soft)]'}`} title={candidate.location}>
                        {candidate.location || "Unknown"}
                      </td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle">{getClassificationBadge(candidate.classification)}</td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle">{getStatusBadge(candidate.status)}</td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle">
                        <span className="border border-border rounded-[8px] px-[10px] py-[4px] text-[12px] text-[var(--ink-soft)] font-medium inline-block">
                          {candidate.platform_name}
                        </span>
                      </td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle font-mono text-[12px] text-muted-foreground whitespace-nowrap hidden md:table-cell">
                        {candidate.processed_timestamp ? new Date(candidate.processed_timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        }) : "Unknown"}
                      </td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle text-right pr-[20px]" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center focus:outline-none">
                            <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-muted-foreground transition-all hover:bg-[var(--violet-glow)] hover:text-[var(--violet)] font-bold ml-auto border border-transparent">
                              ⋯
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/candidates/${candidate.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/candidates/${candidate.id}#comments`)}>
                              <MessageSquare className="h-4 w-4 mr-2" /> Comments
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleDelete(e, candidate.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{candidates.length}</span> of <span className="font-medium text-foreground">{localTotalCount}</span> candidates
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 p-0 bg-card/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground mx-2">
            Page {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={candidates.length < Number(limit)} // Use dynamic limit
            className="h-8 w-8 p-0 bg-card/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
