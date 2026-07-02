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


      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-2">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Details</CardTitle>
              </div>
              <CardDescription>Update your name and basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Contact Info</CardTitle>
              </div>
              <CardDescription>Where you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={email || ""} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Email changes require re-verification.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-background" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Company Details</CardTitle>
              </div>
              <CardDescription>Your organization information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-background" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex justify-end pt-4"
      >
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-32 bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
          {isSaving ? (
            "Saving..."
          ) : isSaved ? (
            "Saved!"
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
