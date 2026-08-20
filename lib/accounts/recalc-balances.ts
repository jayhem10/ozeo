import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Self-heals account balances for scheduled (future-dated) transactions whose
 * date has rolled into the past — the DB trigger that normally keeps
 * `current_balance_cents` in sync only re-fires on transaction writes, not on
 * the calendar turning over. Meant to run daily from a cron trigger.
 */
export async function runAccountBalanceRecalcJob(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("recalc_all_account_balances");
  if (error) throw error;
}
