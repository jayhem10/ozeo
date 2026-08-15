import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsGoal } from "@/types/database";

export async function getSavingsGoals(supabase: SupabaseClient, userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SavingsGoal[];
}
