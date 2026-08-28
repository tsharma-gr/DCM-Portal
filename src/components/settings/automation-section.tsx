"use client";

import { useEffect, useState } from "react";
import { AutomationCard } from "@/components/settings/automation-card";
import { settingsService, AutomationSetting } from "@/services/settingsService";
import { RefreshCw, Bot, Play, Pause, SkipForward, Square } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  "Fire Alarm DCM",
  "Catering DCM",
  "Catering Company Targeter",
  "Height & Safety Company Targeter",
  "Electrical Company Targeter",
  "Large Companies Targeter",
  "Height & Safety DCM"
];

interface QueueStatus {
  queue_id: number;
  current_bot: string;
  status: string;
  last_updated?: string;
}

export function AutomationSection() {
  const [settings, setSettings] = useState<AutomationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live status states from Supabase
  const [q1Status, setQ1Status] = useState<QueueStatus>({ queue_id: 1, current_bot: 'Idle', status: 'Idle' });
  const [q2Status, setQ2Status] = useState<QueueStatus>({ queue_id: 2, current_bot: 'Idle', status: 'Idle' });
  const [isToggling, setIsToggling] = useState(false);

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

  // Fetch & Subscribe to live bot queue status from Supabase
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const { data, error } = await supabase.from('bot_queue_status').select('*');
        if (data && !error) {
          const q1 = data.find(q => q.queue_id === 1);
          const q2 = data.find(q => q.queue_id === 2);
          if (q1) setQ1Status(q1);
          if (q2) setQ2Status(q2);
        }
      } catch (e) {
        console.error("Error fetching bot_queue_status:", e);
      }
    };

    fetchStatuses();

    // Poll every 5 seconds for live status updates
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVpsCommand = async (queue: 'queue1' | 'queue2', action: 'skip' | 'stop' | 'pause' | 'resume') => {
    setIsToggling(true);
    try {
      const res = await fetch('/api/vps-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send command');

      alert(`✅ Command '${action.toUpperCase()}' successfully sent to ${queue.toUpperCase()}! The VPS will execute it within 10 seconds.`);
    } catch (err: any) {
      console.error(err);
      alert(`Error sending command: ${err.message || err}`);
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
        Configure active hours, monitor real-time VPS execution status, and send remote control commands to active bot queues.
      </p>

      {/* VPS Master Controls */}
      <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-[20px] shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--violet)]/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[var(--violet)] animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-[17px] text-[var(--ink)]">Master Server Remote Controls</h3>
            <p className="text-[13px] text-slate-500 font-medium">Monitor live status and remotely manage VPS queue schedulers in real-time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Queue 1 Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-base text-slate-800">Queue 1 (Browser 1)</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Current Bot: <span className="font-semibold text-slate-700">{q1Status.current_bot || 'Idle'}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                q1Status.status === 'Running' ? 'bg-emerald-100 text-emerald-700' :
                q1Status.status === 'Paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                ● {q1Status.status || 'Idle'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {q1Status.status === 'Running' ? (
                <button 
                  onClick={() => handleVpsCommand('queue1', 'pause')}
                  disabled={isToggling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Queue
                </button>
              ) : (
                <button 
                  onClick={() => handleVpsCommand('queue1', 'resume')}
                  disabled={isToggling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Resume Queue
                </button>
              )}

              <button 
                onClick={() => handleVpsCommand('queue1', 'skip')}
                disabled={isToggling}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <SkipForward className="w-3.5 h-3.5" /> Skip Bot
              </button>

              <button 
                onClick={() => handleVpsCommand('queue1', 'stop')}
                disabled={isToggling}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5" /> Stop Queue
              </button>
            </div>
          </div>

          {/* Queue 2 Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-base text-slate-800">Queue 2 (Browser 2)</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Current Bot: <span className="font-semibold text-slate-700">{q2Status.current_bot || 'Idle'}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                q2Status.status === 'Running' ? 'bg-emerald-100 text-emerald-700' :
                q2Status.status === 'Paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                ● {q2Status.status || 'Idle'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {q2Status.status === 'Running' ? (
                <button 
                  onClick={() => handleVpsCommand('queue2', 'pause')}
                  disabled={isToggling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Queue
                </button>
              ) : (
                <button 
                  onClick={() => handleVpsCommand('queue2', 'resume')}
                  disabled={isToggling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Resume Queue
                </button>
              )}

              <button 
                onClick={() => handleVpsCommand('queue2', 'skip')}
                disabled={isToggling}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <SkipForward className="w-3.5 h-3.5" /> Skip Bot
              </button>

              <button 
                onClick={() => handleVpsCommand('queue2', 'stop')}
                disabled={isToggling}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5" /> Stop Queue
              </button>
            </div>
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
