import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabaseBrowserClient?: ReturnType<typeof createBrowserClient>;
  supabaseApiClient?: ReturnType<typeof createClient>;
};

export const supabase = globalForSupabase.supabaseBrowserClient ??= createBrowserClient(
  supabaseUrl,
  supabaseKey
);

export const supabaseAdmin = globalForSupabase.supabaseApiClient ??= createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
});
