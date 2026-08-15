import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget } from "@/types/database";

export async function getBudgets(supabase: SupabaseClient, userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("period", "monthly");
  if (error) throw error;
  return (data ?? []) as Budget[];
}
