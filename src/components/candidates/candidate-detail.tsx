"use client";

import { Candidate, CandidateComment } from "@/types/candidate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Building2, 
  Calendar, 
  ExternalLink, 
  BrainCircuit, 
  ArrowLeft,
  MessageSquare,
  Clock,
  Loader2,
  Pencil,
  Check,
  X,
  Trash,
  Target,
  Tag,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface CandidateDetailProps {
  candidate: Candidate;
  comments: CandidateComment[];
  currentUserEmail: string;
  isSlideOver?: boolean;
}

export function CandidateDetail({ candidate, comments: initialComments, currentUserEmail, isSlideOver = false }: CandidateDetailProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CandidateComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Delete state
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const [status, setStatus] = useState(candidate.status || "New");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCustomStatusInput, setShowCustomStatusInput] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("");

  // Automatically mark as Opened when viewed if it is currently New
  useEffect(() => {
    if (status === "New" || !status) {
      handleStatusChange("Opened");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Candidate Details Edit State
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    candidate_name: candidate.candidate_name || "",
    current_position: candidate.current_position || "",
    classification: candidate.classification || "Error",
    location: candidate.location || "",
    dcm_type: candidate.dcm_type || "",
    platform_name: candidate.platform_name || "",
    cv_link: candidate.cv_link || "",
    job_title: candidate.job_title || "",
    desired_role: candidate.desired_role || "",
  });

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.updateCandidate(candidate.id, editForm);
      router.refresh();
      setIsEditingDetails(false);
    } catch (err) {
      console.error("Failed to update candidate details", err);
      alert("Failed to update details.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      candidate_name: candidate.candidate_name || "",
      current_position: candidate.current_position || "",
      classification: candidate.classification || "Error",
      location: candidate.location || "",
      dcm_type: candidate.dcm_type || "",
      platform_name: candidate.platform_name || "",
      cv_link: candidate.cv_link || "",
      job_title: candidate.job_title || "",
      desired_role: candidate.desired_role || "",
    });
    setIsEditingDetails(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.deleteCandidateComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      router.refresh();
    } catch (err) {
      console.error("Failed to delete comment", err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const startEditing = (comment: CandidateComment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    setIsSavingEdit(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      const updated = await candidateService.editCandidateComment(commentId, editingText.trim());
      setComments(comments.map(c => c.id === commentId ? updated : c));
      cancelEditing();
      router.refresh();
    } catch (err) {
      console.error("Failed to edit comment", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "Other") {
      setShowCustomStatusInput(true);
      return;
    }
    setIsUpdatingStatus(true);
    setStatus(newStatus);
    try {
      const { candidateService } = await import("@/services/candidateService");
      await candidateService.updateCandidateStatus(candidate.id, newStatus);
      router.refresh();
      setShowCustomStatusInput(false);
      setCustomStatusInput("");
    } catch (err) {
      console.error("Failed to update status", err);
      setStatus(candidate.status || "New"); // revert on error
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCustomStatusSave = async () => {
    if (!customStatusInput.trim()) return;
    await handleStatusChange(customStatusInput.trim());
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const { candidateService } = await import("@/services/candidateService");
      const added = await candidateService.addCandidateComment(candidate.id, currentUserEmail, newComment.trim());
      setComments([added, ...comments]);
      setNewComment("");
      router.refresh();
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassificationBadge = (c: string) => {
    switch (c) {
      case "FIT":
        return <Badge className="bg-emerald-500/15 text-emerald-500 text-lg py-1 px-4 border-emerald-500/20">FIT</Badge>;
      case "UNFIT":
        return <Badge className="bg-red-500/15 text-red-500 text-lg py-1 px-4 border-red-500/20">UNFIT</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-500 text-lg py-1 px-4 border-amber-500/20">{c || "Error"}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${isSlideOver ? 'p-6 pt-10' : ''}`}>
      <div className={`flex justify-between items-center ${isSlideOver ? 'sticky top-0 z-10 bg-[#F8F9FC]/90 backdrop-blur pb-4 -mx-6 px-6 -mt-10 pt-10 border-b border-border/50' : ''}`}>
        {!isSlideOver ? (
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="text-muted-foreground hover:text-foreground pl-0 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
        ) : (
          <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight">Candidate Details</h2>
        )}
        
        <div className="flex items-center gap-2 bg-card/50 backdrop-blur p-1 rounded-md border border-border/50">
          <span className="text-sm text-muted-foreground font-medium pl-2">Status:</span>
          {showCustomStatusInput ? (
            <div className="flex items-center gap-2">
              <Input 
                value={customStatusInput} 
                onChange={e => setCustomStatusInput(e.target.value)} 
                placeholder="Others" 
                className="h-8 w-[140px] text-sm bg-background"
                onKeyDown={e => e.key === 'Enter' && handleCustomStatusSave()}
                autoFocus
              />
              <Button size="icon" variant="outline" className="h-8 w-8 text-primary bg-background" onClick={handleCustomStatusSave} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setShowCustomStatusInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Select 
              value={["New", "Opened"].includes(status) ? status : (status ? "Other" : "New")} 
              onValueChange={(val) => val && handleStatusChange(val)} 
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[180px] bg-background border-none shadow-none h-8 focus:ring-1 focus:ring-primary">
                {isUpdatingStatus ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <SelectValue placeholder="Status">
                    {status}
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Opened">Opened</SelectItem>
                {!["New", "Opened", "Other"].includes(status) && status && (
                  <SelectItem value={status}>{status}</SelectItem>
                )}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-1"
        >
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group">
            {/* Subtle gradient accent at top of card */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--violet)] to-[var(--violet-glow)] opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            {!isEditingDetails && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-muted-foreground hover:text-primary z-10"
                onClick={() => setIsEditingDetails(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {isEditingDetails ? (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Candidate Name</Label>
                  <Input value={editForm.candidate_name} onChange={(e) => setEditForm({...editForm, candidate_name: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Current Position</Label>
                  <Input value={editForm.current_position} onChange={(e) => setEditForm({...editForm, current_position: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Classification</Label>
                  <Select value={editForm.classification || "Error"} onValueChange={(v) => setEditForm({...editForm, classification: v as "FIT" | "UNFIT" | "Error"})}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIT">FIT</SelectItem>
                      <SelectItem value="UNFIT">UNFIT</SelectItem>
                      <SelectItem value="Error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Location</Label>
                  <Input value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">DCM Type</Label>
                  <Input value={editForm.dcm_type} onChange={(e) => setEditForm({...editForm, dcm_type: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Platform</Label>
                  <Input value={editForm.platform_name} onChange={(e) => setEditForm({...editForm, platform_name: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Job Title</Label>
                  <Input value={editForm.job_title} onChange={(e) => setEditForm({...editForm, job_title: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">Desired Role</Label>
                  <Input value={editForm.desired_role} onChange={(e) => setEditForm({...editForm, desired_role: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">CV Link</Label>
                  <Input value={editForm.cv_link} onChange={(e) => setEditForm({...editForm, cv_link: e.target.value})} className="bg-background/50" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveDetails} disabled={isSavingDetails} className="flex-1">
                    {isSavingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" disabled={isSavingDetails} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-heading">{candidate.candidate_name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {(() => {
                      if (candidate.current_position && candidate.current_position !== "N/A" && candidate.current_position !== "Unknown") {
                        return candidate.current_position;
                      }
                      if (candidate.job_title && candidate.job_title !== "N/A" && candidate.job_title !== "Unknown") {
                        return candidate.job_title.split(',')[0].trim();
                      }
                      return "Position Not Specified";
                    })()}
                  </CardDescription>
                  <div className="mt-4">
                    {getClassificationBadge(candidate.classification)}
                  </div>
                </CardHeader>
                <Separator className="bg-border/50" />
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.location || "Location Not Specified"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.dcm_type || "DCM Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.platform_name || "Platform Unknown"}</span>
                  </div>
                  {candidate.job_title && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span>Job Title: {candidate.job_title}</span>
                    </div>
                  )}
                  {candidate.desired_role && (
                    <div className="flex items-center gap-3 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>Desired: {candidate.desired_role}</span>
                    </div>
                  )}
                  {candidate.cv_reference && (
                    <div className="flex items-center gap-3 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-[13px]">CV Ref: {candidate.cv_reference}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Processed on {new Date(candidate.processed_timestamp).toLocaleString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="pt-4 flex gap-3">
                    {candidate.cv_link && (
                      <a href={candidate.cv_link} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-[var(--violet)] to-[#8352ff] hover:opacity-90 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none group relative overflow-hidden">
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                          <ExternalLink className="h-4 w-4 mr-2 relative z-10" />
                          <span className="relative z-10 font-medium tracking-wide">View Full CV</span>
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </motion.div>

        {/* Right Side: AI Reasoning and Comments */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="md:col-span-2 space-y-6"
        >
          {/* AI Reasoning Panel */}
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-[var(--violet-glow)] text-[var(--violet)] group-hover:scale-110 transition-transform duration-300">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <CardTitle className="font-heading text-lg">AI Analysis & Reasoning</CardTitle>
              </div>
              <CardDescription>
                Detailed breakdown of why this candidate was marked as {candidate.classification} for {candidate.dcm_type}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative p-[1px] rounded-xl bg-gradient-to-b from-border/80 to-transparent">
                <div className="bg-muted/40 p-6 rounded-[11px] text-[14.5px] leading-relaxed whitespace-pre-wrap font-sans text-foreground/90 shadow-inner">
                  {candidate.ai_reasoning || "No AI reasoning provided for this candidate."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments & Activity Timeline */}
          <Card id="comments" className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <CardTitle className="font-heading text-base">Comments & Activity</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Collaborate with other recruiters and leave notes on this candidate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-2">
                <Textarea 
                  placeholder="Add a comment about this candidate..." 
                  className="min-h-[40px] text-sm resize-none focus-visible:ring-primary bg-background/50"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || isSubmitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
                    Post Comment
                  </Button>
                </div>
              </div>
              
              <Separator className="bg-border/50" />

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                    No comments yet. Be the first to add one!
                  </div>
                ) : (
                  <div className="relative border-l border-border/50 ml-3 pl-6 space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="relative">
                        <div className="absolute -left-[33px] top-1 bg-primary/10 border border-primary/20 p-1.5 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-foreground">{comment.author_email}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                              {comment.author_email === currentUserEmail && editingCommentId !== comment.id && (
                                <div className="flex items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => startEditing(comment)}
                                    disabled={deletingCommentId === comment.id}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    disabled={deletingCommentId === comment.id}
                                  >
                                    {deletingCommentId === comment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea 
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="min-h-[80px] bg-background/50 resize-none text-sm"
                                autoFocus
                                disabled={isSavingEdit}
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={cancelEditing}
                                  disabled={isSavingEdit}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editingText.trim() || isSavingEdit || editingText.trim() === comment.comment}
                                >
                                  {isSavingEdit ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
