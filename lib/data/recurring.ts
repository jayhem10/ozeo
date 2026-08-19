import type { SupabaseClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import type { Account, Category, RecurringTransaction } from "@/types/database";
import { nextOccurrenceAfter } from "@/lib/recurring/schedule";

export type RecurringOccurrence = RecurringTransaction & { occurrence_date: string };

export async function getRecurringTransactions(
  supabase: SupabaseClient,
  userId: string,
  accountId?: string
): Promise<(RecurringTransaction & { category: Category | null; account: Account })[]> {
  let query = supabase
    .from("recurring_transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", userId);
  if (accountId) query = query.eq("account_id", accountId);
  const { data, error } = await query.order("next_occurrence", { ascending: true });
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

export async function getRecurringOccurrencesThrough(
  supabase: SupabaseClient,
  userId: string,
  throughDate: string,
  accountId?: string
): Promise<RecurringOccurrence[]> {
  let query = supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .lte("next_occurrence", throughDate);
  if (accountId) query = query.eq("account_id", accountId);
  const { data, error } = await query.order("next_occurrence", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as RecurringTransaction[]).flatMap((recurring) => {
    const occurrences: RecurringOccurrence[] = [];
    let occurrence = parseISO(recurring.next_occurrence);
    let iterations = 0;

    while (format(occurrence, "yyyy-MM-dd") <= throughDate && iterations < 1200) {
      occurrences.push({ ...recurring, occurrence_date: format(occurrence, "yyyy-MM-dd") });
      occurrence = nextOccurrenceAfter(occurrence, recurring);
      iterations++;
    }

    return occurrences;
  });
}
