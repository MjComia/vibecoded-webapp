import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

// Client for authenticated or public operations
export const supabase = createClient(
  config.supabaseUrl || "https://placeholder.supabase.co",
  config.supabaseAnonKey || "placeholder-anon-key"
);

// Admin client with service role key (bypasses RLS for secure background tasks)
export const supabaseAdmin = config.supabaseServiceKey
  ? createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
