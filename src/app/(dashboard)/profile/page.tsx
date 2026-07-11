"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Save, Building } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>("Loading...");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "admin@talentverse.com");
        const meta = user.user_metadata || {};
        setFirstName(meta.firstName || "Admin");
        setLastName(meta.lastName || "User");
        setTitle(meta.title || "System Administrator");
        setPhone(meta.phone || "");
        setDepartment(meta.department || "IT & Infrastructure");
        setCompany(meta.company || "TalentVerse");
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save to Supabase auth metadata so it persists across logouts
    const { error } = await supabase.auth.updateUser({
      data: { firstName, lastName, title, phone, department, company }
    });
    
    setIsSaving(false);
    if (!error) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      console.error("Failed to update profile", error);
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500 max-w-4xl">


      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-2">
          <Card className="bg-white/60 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <CardHeader className="border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--violet-glow)] flex items-center justify-center text-[var(--violet)]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[var(--ink)]">Personal Details</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Update your name and basic information.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[12px] font-semibold text-slate-600">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[12px] font-semibold text-slate-600">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[12px] font-semibold text-slate-600">Job Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-white/60 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full">
            <CardHeader className="border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[var(--ink)]">Contact Info</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Where you receive notifications.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-semibold text-slate-600">Email Address</Label>
                <Input id="email" value={email || ""} disabled className="bg-black/5 border-black/5 text-slate-500 h-9 rounded-lg text-[13px]" />
                <p className="text-[11px] text-slate-400 mt-1">Email changes require re-verification.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[12px] font-semibold text-slate-600">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="bg-white/60 backdrop-blur-xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full">
            <CardHeader className="border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[var(--ink)]">Company Details</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Your organization information.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-[12px] font-semibold text-slate-600">Company Name</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-[12px] font-semibold text-slate-600">Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-white/50 border-black/5 focus:bg-white focus:border-[var(--violet)] focus:ring-[var(--violet-glow)] h-9 rounded-lg transition-all text-[13px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex justify-end pt-2 pb-6"
      >
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="gap-2 px-6 h-10 rounded-lg bg-[var(--violet)] text-white hover:bg-indigo-600 shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.23)] hover:-translate-y-0.5 transition-all duration-200 font-bold text-[13px]"
        >
          {isSaving ? (
            "Saving..."
          ) : isSaved ? (
            "Saved Successfully!"
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
