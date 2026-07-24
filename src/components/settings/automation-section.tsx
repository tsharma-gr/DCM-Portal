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
  "Estimator DCM",
  "QS DCM",
  "Scaffolding DCM",
  "Temporary Works Design DCM",
  "Demolition DCM",
  "Passive Fire Protection DCM",
  "Consultancy Civil & Structural DCM",
  "Health & Safety DCM",
  "Waste Management DCM",
  "Firesec DCM",
  "Catering DCM",
  "Catering Company Targeter"
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

  const [q1State, setQ1State] = useState<'running' | 'paused'>('running');
  const [q2State, setQ2State] = useState<'running' | 'paused'>('running');
  const [isToggling, setIsToggling] = useState(false);

  const handleVpsToggle = async (queue: 'queue1' | 'queue2', currentState: 'running' | 'paused') => {
    setIsToggling(true);
    const action = currentState === 'running' ? 'pause' : 'resume';
    try {
      const res = await fetch('/api/vps-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue, action })
      });
      if (!res.ok) throw new Error('Failed to send command to server');
      
      if (queue === 'queue1') setQ1State(action === 'pause' ? 'paused' : 'running');
      if (queue === 'queue2') setQ2State(action === 'pause' ? 'paused' : 'running');
    } catch (err) {
      console.error(err);
      alert('Error communicating with the VPS. Ensure the local terminal running this app has SSH access.');
    } finally {
      setIsToggling(false);
    }
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
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Configure the active hours and scheduling for your AI screening agents across all active DCM systems. The bots will automatically pause processing outside of these configured windows.
      </p>

      {/* VPS Master Controls */}
      <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-[20px] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--violet)]/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[var(--violet)] animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-[17px] text-[var(--ink)]">Master Server Controls</h3>
            <p className="text-[13px] text-slate-500 font-medium">Instantly suspend or resume queue schedulers directly on the VPS.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div>
              <div className="font-bold text-sm">Queue 1 (Browser 1)</div>
              <div className="text-xs text-slate-500 capitalize">{q1State}</div>
            </div>
            <button 
              onClick={() => handleVpsToggle('queue1', q1State)}
              disabled={isToggling}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${q1State === 'running' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {q1State === 'running' ? 'Pause Queue' : 'Resume Queue'}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div>
              <div className="font-bold text-sm">Queue 2 (Browser 2)</div>
              <div className="text-xs text-slate-500 capitalize">{q2State}</div>
            </div>
            <button 
              onClick={() => handleVpsToggle('queue2', q2State)}
              disabled={isToggling}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${q2State === 'running' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {q2State === 'running' ? 'Pause Queue' : 'Resume Queue'}
            </button>
          </div>
        </div>
      </div>

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
