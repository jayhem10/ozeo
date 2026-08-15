import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account } from "@/types/database";

export async function getAccounts(
  supabase: SupabaseClient,
  userId: string,
  includeArchived = false
): Promise<Account[]> {
  let query = supabase.from("accounts").select("*").eq("user_id", userId);
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function getTotalBalance(accounts: Pick<Account, "current_balance_cents">[]): Promise<number> {
  return accounts.reduce((sum, a) => sum + a.current_balance_cents, 0);
}
