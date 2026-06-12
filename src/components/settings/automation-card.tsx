"use client";

import { useState } from "react";
import { AutomationSetting } from "@/services/settingsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square, Save, Bot, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface AutomationCardProps {
  dcmType: string;
  initialSetting?: AutomationSetting;
  onSave: (setting: AutomationSetting) => Promise<void>;
  delay?: number;
}

export function AutomationCard({ dcmType, initialSetting, onSave, delay = 0 }: AutomationCardProps) {
  const [startTime, setStartTime] = useState(initialSetting?.start_time || "08:00");
  const [stopTime, setStopTime] = useState(initialSetting?.stop_time || "18:00");
  const [timezone, setTimezone] = useState(initialSetting?.timezone || "Europe/London");
  const [isEnabled, setIsEnabled] = useState(initialSetting?.enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Instantly save status changes
  const handleStatusChange = async (newStatus: boolean) => {
    setIsEnabled(newStatus);
    setIsSaving(true);
    try {
      await onSave({
        dcm_type: dcmType,
        start_time: startTime,
        stop_time: stopTime,
        timezone,
        enabled: newStatus,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: unknown) {
      console.error("Failed to update status", error);
      setIsEnabled(!newStatus); // revert
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Supabase Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        dcm_type: dcmType,
        start_time: startTime,
        stop_time: stopTime,
        timezone,
        enabled: isEnabled,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: unknown) {
      console.error("Failed to save setting", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Supabase Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`bg-card/50 backdrop-blur border-border/50 h-full relative overflow-hidden group hover:border-primary/30 transition-colors ${!isEnabled ? "opacity-75 grayscale-[0.2]" : ""}`}>
        <CardHeader className="relative z-20 pb-4 border-b border-border/50 mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{dcmType}</CardTitle>
                  <CardDescription>AI Processing Schedule</CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                {isEnabled ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Running
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Stopped
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={isEnabled ? "outline" : "default"}
                  className={!isEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                  onClick={() => handleStatusChange(true)}
                  disabled={isEnabled || isSaving}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" /> Start
                </Button>
                <Button 
                  size="sm" 
                  variant={!isEnabled ? "outline" : "destructive"}
                  onClick={() => handleStatusChange(false)}
                  disabled={!isEnabled || isSaving}
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" /> Stop
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative z-20">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <Clock className="h-3 w-3" /> Start Time
              </Label>
              <Input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-background/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <Clock className="h-3 w-3" /> Stop Time
              </Label>
              <Input 
                type="time" 
                value={stopTime} 
                onChange={(e) => setStopTime(e.target.value)}
                className="bg-background/50 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Timezone</Label>
            <Select value={timezone} onValueChange={(val) => val && setTimezone(val)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="sm"
              className="gap-2 transition-all w-32"
            >
              {isSaving ? (
                "Saving..."
              ) : isSaved ? (
                "Saved!"
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Setup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
