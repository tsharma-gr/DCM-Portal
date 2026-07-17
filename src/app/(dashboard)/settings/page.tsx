"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Shield, Moon, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { AutomationSection } from "@/components/settings/automation-section";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>("Loading...");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email || "admin@talentverse.com");
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500 max-w-4xl">


      <div className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>Your personal account details and credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={email || ""} readOnly className="bg-muted/50 max-w-md" />
                <p className="text-xs text-muted-foreground mt-1">This is the email associated with your administrator account.</p>
              </div>
              <div className="grid gap-2 pt-2">
                <Label htmlFor="role">Account Role</Label>
                <Input id="role" value="Super Administrator" readOnly className="bg-muted/50 max-w-md" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <AutomationSection />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                <CardTitle>Appearance & UI</CardTitle>
              </div>
              <CardDescription>Customize how the dashboard looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">The dashboard is currently locked to a premium dark theme.</p>
                </div>
                <Switch checked={true} disabled />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Compact Table View</Label>
                  <p className="text-sm text-muted-foreground">Show more rows per page in the candidates table.</p>
                </div>
                <Switch checked={false} />
              </div>
            </CardContent>
          </Card>
        </motion.div>


        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50 border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Account Actions</CardTitle>
              </div>
              <CardDescription>Destructive or security-related actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Signing out will clear your current session and require you to log back in using your credentials.
              </p>
              <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out Securely
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
