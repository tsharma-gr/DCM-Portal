"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  const [classification, setClassification] = useState(searchParams.get("classification") || "All");
  const [dcmType, setDcmType] = useState(searchParams.get("dcmType") || "All");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "All");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [limit, setLimit] = useState(searchParams.get("limit") || "10");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Sync external URL changes (like Sidebar clicks) to local state
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setClassification(searchParams.get("classification") || "All");
    setDcmType(searchParams.get("dcmType") || "All");
    setPlatform(searchParams.get("platform") || "All");
    setDate(searchParams.get("date") || "");
    setLimit(searchParams.get("limit") || "10");
    setPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  // Keep a ref to the latest filters so the WebSocket callback can access them
  const filtersRef = useRef({ search, classification, dcmType, platform, date });
  useEffect(() => {
    filtersRef.current = { search, classification, dcmType, platform, date };
  }, [search, classification, dcmType, platform, date]);
  
  // Local state for optimistic updates
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [localTotalCount, setLocalTotalCount] = useState(totalCount);

  // Use useLayoutEffect to restore scroll instantly before the browser paints, avoiding the glitch
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    // We use a simple layout effect fallback pattern here because Next.js warns about useLayoutEffect in SSR
    const savedScrollY = sessionStorage.getItem("candidatesScrollY");
    if (savedScrollY && candidates.length > 0) {
      window.scrollTo({ top: parseInt(savedScrollY, 10), behavior: "instant" });
      sessionStorage.removeItem("candidatesScrollY");
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
    const headers = ["ID", "Name", "Position", "Job Title", "Desired Role", "Classification", "Status", "Location", "DCM Type", "Platform", "Date Processed"];
    const csvRows = candidates.map(c => [
      c.id,
      `"${(c.candidate_name || '').replace(/"/g, '""')}"`,
      `"${(c.current_position || '').replace(/"/g, '""')}"`,
      `"${(c.job_title || '').replace(/"/g, '""')}"`,
      `"${(c.desired_role || '').replace(/"/g, '""')}"`,
      c.classification || '',
      c.status || '',
      `"${(c.location || '').replace(/"/g, '""')}"`,
      c.dcm_type || '',
      c.platform_name || '',
      new Date(c.processed_timestamp).toISOString()
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
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (classification && classification !== "All") params.set("classification", classification);
      if (dcmType && dcmType !== "All") params.set("dcmType", dcmType);
      if (platform && platform !== "All") params.set("platform", platform);
      if (date) params.set("date", date);
      if (limit && limit !== "10") params.set("limit", limit);
      if (page > 1) params.set("page", page.toString());
      
      router.push(`/candidates?${params.toString()}`);
    }, 500);
    return () => clearTimeout(handler);
  }, [search, classification, dcmType, platform, date, limit, page, router]);

  const getClassificationBadge = (c: string) => {
    switch (c) {
      case "FIT":
        return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">FIT</Badge>;
      case "UNFIT":
        return <Badge className="bg-red-500/15 text-red-500 border-red-500/20">UNFIT</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20">{c || "Pending"}</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "New": return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
      case "Under review": return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Under review</Badge>;
      case "Contacted": return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Contacted</Badge>;
      case "Relevant": return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Relevant</Badge>;
      case "Rejected": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case "Hired": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Hired</Badge>;
      default: 
        if (status) return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">{status}</Badge>;
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
    }
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
          <h1 className="text-3xl font-bold font-heading tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage parsed candidates from the AI pipeline.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="bg-background/50 border-border/50 shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-9 bg-background/50 border-border/50"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex flex-wrap w-full sm:w-auto gap-3 items-center">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select value={classification} onValueChange={(v) => { if (v) { setClassification(v); setPage(1); } }}>
            <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
              <span className="text-muted-foreground font-medium mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="FIT">FIT</SelectItem>
              <SelectItem value="UNFIT">UNFIT</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dcmType} onValueChange={(v) => { if (v) { setDcmType(v); setPage(1); } }}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
              <span className="text-muted-foreground font-medium mr-1">DCM:</span>
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
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={(v) => { if (v) { setPlatform(v); setPage(1); } }}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
              <span className="text-muted-foreground font-medium mr-1">Platform:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="CV-Library">CV-Library</SelectItem>
              <SelectItem value="Totaljobs">Totaljobs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit} onValueChange={(v) => { if (v) { setLimit(v); setPage(1); } }}>
            <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
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
        </div>
      </div>

      {selectedIds.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3 px-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm text-primary">{selectedIds.size} candidates selected</span>
          </div>
          <div className="flex items-center gap-2">
            {showBulkCustomStatus ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={bulkCustomStatus} 
                  onChange={e => setBulkCustomStatus(e.target.value)} 
                  placeholder="Others" 
                  className="h-8 w-[140px] text-xs bg-background"
                  onKeyDown={e => e.key === 'Enter' && handleApplyBulkCustomStatus()}
                  autoFocus
                />
                <Button size="icon" variant="outline" className="h-8 w-8 bg-background" onClick={handleApplyBulkCustomStatus} disabled={isBulkUpdating}>
                  {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setShowBulkCustomStatus(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select onValueChange={(v: string | null) => { if (v) handleBulkStatusUpdate(v); }} disabled={isBulkUpdating}>
                <SelectTrigger className="h-8 w-[140px] bg-background text-xs">
                  <SelectValue placeholder="Change Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Under review">Under review</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Relevant">Relevant</SelectItem>
                  <SelectItem value="Hired">Hired</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkUpdating} className="h-8 text-xs">
              {isBulkUpdating ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Trash className="h-3 w-3 mr-2" />}
              Delete Selected
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[50px] px-4">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary translate-y-[2px]" 
                  checked={candidates.length > 0 && selectedIds.size === candidates.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[250px]">Candidate</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="hidden md:table-cell">Processed</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No candidates found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  className="border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => {
                    sessionStorage.setItem("candidatesScrollY", window.scrollY.toString());
                    router.push(`/candidates/${candidate.id}`);
                  }}
                >
                  <TableCell className="w-[50px] px-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary translate-y-[2px]" 
                      checked={selectedIds.has(candidate.id)}
                      onChange={() => toggleSelect(candidate.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{candidate.candidate_name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[150px] truncate" title={candidate.location}>
                    {candidate.location || "N/A"}
                  </TableCell>
                  <TableCell>{getClassificationBadge(candidate.classification)}</TableCell>
                  <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {candidate.platform_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap hidden md:table-cell">
                    {candidate.processed_timestamp ? new Date(candidate.processed_timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary ml-auto">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            sessionStorage.setItem("candidatesScrollY", window.scrollY.toString());
                            router.push(`/candidates/${candidate.id}`);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            sessionStorage.setItem("candidatesScrollY", window.scrollY.toString());
                            router.push(`/candidates/${candidate.id}#comments`);
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Comments
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => handleDelete(e, candidate.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
