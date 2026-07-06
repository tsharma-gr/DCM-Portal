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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Candidate } from "@/types/candidate";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, MoreHorizontal, Eye, Trash, MessageSquare, Download, CheckSquare, Loader2, Check, X, CalendarIcon, Filter, Layers, Globe, ListOrdered, MapPin } from "lucide-react";

import { exportCandidatesToExcel } from "@/utils/excel-export";
import { CandidateSlideOver } from "./candidate-slideover";

import { motion, AnimatePresence } from "framer-motion";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

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
  const filtersRef = useRef({ search, classification, dcmType, platform, date, limit, page });
  useEffect(() => {
    filtersRef.current = { search, classification, dcmType, platform, date, limit, page };
  }, [search, classification, dcmType, platform, date, limit, page]);
  
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

  const handleExportExcel = () => {
    const candidatesToExport = selectedIds.size > 0
      ? candidates.filter(c => selectedIds.has(c.id))
      : candidates;

    if (!candidatesToExport.length) {
      toast.error("No candidates to export");
      return;
    }

    exportCandidatesToExcel(candidatesToExport, dcmType === "All" ? "Combined" : dcmType);
    toast.success(`Exported ${candidatesToExport.length} candidates to Excel`);
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

            // Instantly add to top of table if on page 1, respecting the limit
            if (filters.page === 1) {
              setCandidates(prev => {
                const updated = [newCandidate, ...prev];
                const limitNum = Number(filters.limit) || 10;
                return updated.slice(0, limitNum);
              });
            }
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


  return (
    <div className="space-y-4 pt-1">
      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-[12px] mb-[20px] flex-wrap bg-white/50 border border-border/50 p-2 rounded-[12px] shadow-sm">
        <div className="flex flex-wrap gap-[12px] items-center">
          <div className="flex items-center gap-2 ml-1 mr-1 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <div className="h-[20px] w-[1px] bg-border mx-1 hidden sm:block"></div>

          <Select value={classification} onValueChange={(v) => { if (v) { setClassification(v); setPage(1); } }}>
            <SelectTrigger className="h-[36px] bg-white border border-border/80 hover:border-border rounded-[8px] px-3 text-[13px] shadow-sm transition-all focus:ring-0 focus:border-[var(--violet)]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-foreground">{classification}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="FIT">FIT</SelectItem>
              <SelectItem value="UNFIT">UNFIT</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dcmType} onValueChange={(v) => { if (v) { setDcmType(v); setPage(1); } }}>
            <SelectTrigger className="h-[36px] bg-white border border-border/80 hover:border-border rounded-[8px] px-3 text-[13px] shadow-sm transition-all focus:ring-0 focus:border-[var(--violet)]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">DCM:</span>
                <span className="font-medium text-foreground">{dcmType.length > 15 ? dcmType.substring(0,15) + '...' : dcmType}</span>
              </div>
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
              <SelectItem value="Passive Fire Protection">Passive Fire Protection</SelectItem>
              <SelectItem value="Consultancy Civil & Structural">Consultancy Civil & Structural</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={(v) => { if (v) { setPlatform(v); setPage(1); } }}>
            <SelectTrigger className="h-[36px] bg-white border border-border/80 hover:border-border rounded-[8px] px-3 text-[13px] shadow-sm transition-all focus:ring-0 focus:border-[var(--violet)]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Platform:</span>
                <span className="font-medium text-foreground">{platform}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="CV-Library">CV-Library</SelectItem>
              <SelectItem value="Totaljobs">Totaljobs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit} onValueChange={(v) => { if (v) { setLimit(v); setPage(1); } }}>
            <SelectTrigger className="h-[36px] bg-white border border-border/80 hover:border-border rounded-[8px] px-3 text-[13px] shadow-sm transition-all focus:ring-0 focus:border-[var(--violet)] w-[auto]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Per page:</span>
                <span className="font-medium text-foreground">{limit}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <div 
            className="relative flex items-center group h-[36px] bg-white border border-border/80 rounded-[8px] shadow-sm hover:border-border transition-all focus-within:border-[var(--violet)] focus-within:shadow-[0_0_0_2px_rgba(147,83,245,0.1)] px-3 cursor-pointer"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <span className="text-muted-foreground text-[13px] font-medium mr-2 pointer-events-none">Date:</span>
            <div className="relative flex items-center h-full pointer-events-none">
              <Input 
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                className="w-[105px] p-0 h-auto border-none shadow-none text-[var(--ink)] text-[13px] font-medium focus-visible:ring-0 bg-transparent pointer-events-auto cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-clear-button]:hidden relative z-10"
              />
            </div>
            
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--violet)]/10 ml-1 shrink-0 transition-colors group-hover:bg-[var(--violet)]/20 pointer-events-none">
              <CalendarIcon className="h-3.5 w-3.5 text-[var(--violet)]" />
            </div>

            {date && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); setDate(""); setPage(1); }}
                className="h-[22px] w-[22px] ml-1 p-0 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors relative z-20 shrink-0"
              >
                <X className="h-[14px] w-[14px]" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-[8px] bg-[var(--violet)] text-white border-none rounded-[10px] p-[10px_16px] text-[13.5px] font-semibold font-inherit cursor-pointer transition-all hover:bg-[var(--violet-deep)] hover:-translate-y-[1px]">
            <Download className="h-4 w-4" />
            {selectedIds.size > 0 ? "Export Selected" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Floating Bulk Actions Pill */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-[calc(50%_+_125px)] flex items-center gap-3 bg-[#16152b]/70 border border-white/10 rounded-full p-2 pr-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 pl-3 pr-2 border-r border-white/10">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--violet)] text-white shadow-sm">
                <CheckSquare className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-[13.5px] text-white whitespace-nowrap">{selectedIds.size} selected</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                disabled={isBulkUpdating} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[13px] font-semibold transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 whitespace-nowrap"
              >
                {isBulkUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                Delete
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())} 
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Deselect all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] bg-[#16152b] border border-white/10 text-white shadow-[0_16px_64px_rgba(0,0,0,0.5)] !rounded-[16px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Trash className="w-5 h-5" />
              </div>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-4 text-[14.5px] pl-[52px]">
              Are you sure you want to permanently delete <strong>{selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 pt-4 border-t border-white/5 flex sm:justify-end gap-3 pl-[52px]">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-[10px]">
              No, Cancel
            </Button>
            <Button onClick={() => {
              setShowDeleteConfirm(false);
              handleBulkDelete();
            }} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-[10px] border-none shadow-[0_4px_12px_rgba(239,68,68,0.3)]">
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(20,15,50,0.03)] flex flex-col"
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
          <table className="w-full border-collapse">
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
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border whitespace-nowrap">Candidate</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border whitespace-nowrap">Location</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border whitespace-nowrap">Classification</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border whitespace-nowrap">Status</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border whitespace-nowrap">Platform</th>
                <th className="sticky top-0 z-[2] bg-[#FBFAFE] text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase text-muted-foreground px-[18px] py-[14px] border-b border-border pr-[20px] whitespace-nowrap">Processed</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-[300px] align-middle">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-[48px] h-[48px] rounded-full bg-[var(--violet-glow)] flex items-center justify-center mb-[16px]">
                        <Search className="h-[20px] w-[20px] text-[var(--violet)]" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-[var(--ink)] mb-[4px]">No candidates found</h3>
                      <p className="text-[13.5px] text-muted-foreground max-w-[250px]">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
                    </div>
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
                      onClick={() => setSelectedCandidate(candidate)}
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
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle truncate max-w-[220px]" title={candidate.candidate_name}>
                        <div className="flex items-center gap-[12px] font-semibold text-[var(--ink)] truncate">
                          <div 
                            className="relative w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[12.5px] font-extrabold text-white shrink-0 transition-all duration-300 group-hover:rounded-full border border-black/5" 
                            style={{ background: color }}
                          >
                            {/* Glass glossy overlay */}
                            <div className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none transition-all duration-300 group-hover:rounded-full"></div>
                            <span className="relative z-10 tracking-wide">{initials}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="truncate transition-colors duration-200 group-hover:text-[var(--violet)] font-semibold text-[14px] text-[var(--ink)] leading-tight">{candidate.candidate_name}</span>
                            {(() => {
                              const pos = (candidate.current_position && candidate.current_position !== "N/A" && candidate.current_position !== "Unknown") 
                                ? candidate.current_position 
                                : (candidate.job_title && candidate.job_title !== "N/A" && candidate.job_title !== "Unknown") 
                                  ? candidate.job_title.split(',')[0].trim() 
                                  : null;
                              return pos ? (
                                <span className="truncate text-[12.5px] text-slate-400 font-medium leading-tight mt-0.5">{pos}</span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className={`px-[18px] py-[13px] text-[13.5px] align-middle truncate max-w-[200px] ${!candidate.location || candidate.location === 'Unknown' ? 'text-muted-foreground italic' : 'text-[var(--ink-soft)]'}`} title={candidate.location}>
                        <div className="flex items-center gap-1.5">
                          {candidate.location && candidate.location !== 'Unknown' && <MapPin className="h-3.5 w-3.5 text-[#EC4899] shrink-0" />}
                          <span className="truncate">{candidate.location || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle whitespace-nowrap">{getClassificationBadge(candidate.classification)}</td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle whitespace-nowrap">{getStatusBadge(candidate.status)}</td>
                      <td className="px-[18px] py-[13px] text-[13.5px] align-middle whitespace-nowrap">
                        <span className="border border-border rounded-[8px] px-[10px] py-[4px] text-[12px] text-[var(--ink-soft)] font-medium inline-block">
                          {candidate.platform_name}
                        </span>
                      </td>
                      <td className="px-[18px] py-[13px] align-middle whitespace-nowrap text-left pr-[20px]">
                        {candidate.processed_timestamp ? (
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-[13px] font-medium text-[var(--ink)]">
                              {new Date(candidate.processed_timestamp).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-[11.5px] font-mono text-muted-foreground uppercase tracking-wider">
                              {new Date(candidate.processed_timestamp).toLocaleTimeString(undefined, {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">Unknown</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-border">
          <p className="text-[13.5px] text-slate-500 tracking-wide">
            Showing <span className="font-bold text-[var(--ink)]">{candidates.length}</span> of <span className="font-bold text-[var(--ink)]">{localTotalCount}</span> candidates
          </p>
          <div className="flex items-center space-x-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0 bg-white border-slate-200 shadow-sm rounded-[10px] text-slate-500 hover:text-[var(--violet)] hover:bg-[var(--violet)]/5 hover:border-[var(--violet)]/30 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-3 py-1 bg-[var(--violet)]/10 text-[var(--violet)] text-[13px] font-bold rounded-[10px] border border-[var(--violet)]/20 mx-1">
              Page {page}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(localTotalCount / Number(limit))}
              className="h-8 w-8 p-0 bg-white border-slate-200 shadow-sm rounded-[10px] text-slate-500 hover:text-[var(--violet)] hover:bg-[var(--violet)]/5 hover:border-[var(--violet)]/30 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Slide-over for candidate details */}
      <CandidateSlideOver 
        candidate={selectedCandidate} 
        isOpen={!!selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </div>
  );
}
