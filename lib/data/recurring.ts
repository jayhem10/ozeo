import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import type { Account, Category, RecurringTransaction } from "@/types/database";

export async function getRecurringTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<(RecurringTransaction & { category: Category | null; account: Account })[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", userId)
    .order("next_occurrence", { ascending: true });
  if (error) throw error;
  return (data ?? []) as (RecurringTransaction & { category: Category | null; account: Account })[];
}

export async function getUpcomingRecurring(
  supabase: SupabaseClient,
  userId: string,
  withinDays = 7
): Promise<(RecurringTransaction & { category: Category | null; account: Account })[]> {
  const today = new Date();
  const until = new Date(today);
  until.setDate(until.getDate() + withinDays);

  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_occurrence", format(until, "yyyy-MM-dd"))
    .order("next_occurrence", { ascending: true });
  if (error) throw error;
  return (data ?? []) as (RecurringTransaction & { category: Category | null; account: Account })[];
}
