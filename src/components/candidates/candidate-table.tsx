"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, MoreHorizontal, Eye, Trash, MessageSquare, Download, CheckSquare, Loader2 } from "lucide-react";
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
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [classification, setClassification] = useState(searchParams.get("classification") || "All");
  const [dcmType, setDcmType] = useState(searchParams.get("dcmType") || "All");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "All");
  const [limit, setLimit] = useState(searchParams.get("limit") || "10");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  
  // Local state for optimistic updates
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [localTotalCount, setLocalTotalCount] = useState(totalCount);

  // Bulk Actions & Export State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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
    setIsBulkUpdating(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.bulkUpdateCandidates(Array.from(selectedIds), { status: newStatus as "New" | "Under Review" | "Contacted" | "Rejected" });
      setCandidates(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status: newStatus as "New" | "Under Review" | "Contacted" | "Rejected" } : c));
      setSelectedIds(new Set());
      router.refresh();
      toast.success(`Updated ${selectedIds.size} candidates to ${newStatus}`);
    } catch (error) {
      console.error("Bulk update failed:", error);
      toast.error("Failed to update candidates");
    } finally {
      setIsBulkUpdating(false);
    }
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
    const headers = ["ID", "Name", "Position", "Classification", "Status", "Location", "DCM Type", "Platform", "Date Processed"];
    const csvRows = candidates.map(c => [
      c.id,
      `"${(c.candidate_name || '').replace(/"/g, '""')}"`,
      `"${(c.current_position || '').replace(/"/g, '""')}"`,
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

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (classification && classification !== "All") params.set("classification", classification);
      if (dcmType && dcmType !== "All") params.set("dcmType", dcmType);
      if (platform && platform !== "All") params.set("platform", platform);
      if (limit && limit !== "10") params.set("limit", limit);
      if (page > 1) params.set("page", page.toString());
      
      router.push(`/candidates?${params.toString()}`);
    }, 500);
    return () => clearTimeout(handler);
  }, [search, classification, dcmType, platform, limit, page, router]);

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
      case "Under Review": return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Reviewing</Badge>;
      case "Contacted": return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Contacted</Badge>;
      case "Interview Scheduled": return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Interview</Badge>;
      case "Rejected": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case "Hired": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Hired</Badge>;
      default: return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">New</Badge>;
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

          <Button variant="outline" onClick={handleExportCSV} className="bg-background/50 border-border/50 hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
            <Select onValueChange={handleBulkStatusUpdate} disabled={isBulkUpdating}>
              <SelectTrigger className="h-8 w-[140px] bg-background text-xs">
                <SelectValue placeholder="Change Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
              candidates.map((candidate, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={candidate.id}
                  className="border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
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
                          <DropdownMenuItem onClick={() => router.push(`/candidates/${candidate.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/candidates/${candidate.id}#comments`)}>
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
                </motion.tr>
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
