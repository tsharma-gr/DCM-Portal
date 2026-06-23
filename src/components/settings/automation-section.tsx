"use client";

import { useEffect, useState } from "react";
import { AutomationCard } from "@/components/settings/automation-card";
import { settingsService, AutomationSetting } from "@/services/settingsService";
import { RefreshCw, Bot } from "lucide-react";

const DCM_TYPES = [
  "Exterior DCM",
  "Structural DCM",
  "Windows and Doors DCM",
  "BID DCM",
  "Estimator DCM"
];

export function AutomationSection() {
  const [settings, setSettings] = useState<AutomationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getAutomationSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (setting: AutomationSetting) => {
    await settingsService.updateAutomationSetting(setting);
    setSettings(prev => {
      const exists = prev.find(s => s.dcm_type === setting.dcm_type);
      if (exists) {
        return prev.map(s => s.dcm_type === setting.dcm_type ? setting : s);
      }
      return [...prev, setting];
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center border rounded-xl bg-card/50">
        <RefreshCw className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">AI Automation Scheduling</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Configure the active hours and scheduling for your AI screening agents across all active DCM systems. The bots will automatically pause processing outside of these configured windows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DCM_TYPES.map((dcm, index) => {
          const setting = settings.find(s => s.dcm_type === dcm);
          return (
            <AutomationCard 
              key={dcm} 
              dcmType={dcm} 
              initialSetting={setting} 
              onSave={handleSave}
              delay={index * 0.1}
            />
          );
        })}
      </div>
    </div>
  );
}
