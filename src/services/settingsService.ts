import { supabaseAdmin as supabase } from "@/lib/supabase";

export interface AutomationSetting {
  id?: string;
  dcm_type: string;
  start_time: string;
  stop_time: string;
  timezone: string;
  enabled: boolean;
  updated_at?: string;
}

export const settingsService = {
  async getAutomationSettings(): Promise<AutomationSetting[]> {
    const { data, error } = await supabase
      .from("automation_settings")
      .select("*")
      .order("dcm_type", { ascending: true });

    if (error) {
      console.error("Error fetching automation settings:", error);
      return []; // Return empty if table doesn't exist yet to prevent crashes
    }
    return data || [];
  },

  async updateAutomationSetting(setting: AutomationSetting): Promise<AutomationSetting> {
    // First check if it exists
    const { data: existing } = await supabase
      .from("automation_settings")
      .select("id")
      .eq("dcm_type", setting.dcm_type)
      .single();

    const payload = {
      dcm_type: setting.dcm_type,
      start_time: setting.start_time,
      stop_time: setting.stop_time,
      timezone: setting.timezone,
      enabled: setting.enabled,
    };

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("automation_settings")
        .update(payload)
        .eq("dcm_type", setting.dcm_type)
        .select()
        .single();
      if (error) throw new Error(`Failed to update: ${error.message}`);
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from("automation_settings")
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(`Failed to insert: ${error.message}`);
      result = data;
    }

    return result;
  }
};
