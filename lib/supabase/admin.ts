import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged, server-only operations (e.g. cron jobs).
// Never import this from client components or expose the service role key.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
