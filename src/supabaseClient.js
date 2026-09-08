import { createClient } from "@supabase/supabase-js";

const runtimeEnv = import.meta.env || {};
const nodeEnv = typeof process !== "undefined" ? process.env : {};

const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL;
const supabasePublishableKey =
  runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY || nodeEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);