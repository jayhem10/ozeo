import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, Category, SavingsGoal, Transaction } from "@/types/database";

export interface TransactionFilters {
  from?: string;
  to?: string;
  categoryId?: string;
  accountId?: string;
  type?: "expense" | "income" | "transfer";
  minAmountCents?: number;
  maxAmountCents?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionsResult {
  transactions: (Transaction & { category: Category | null; account: Account; goal: SavingsGoal | null })[];
  total: number;
}

export async function getTransactions(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionsResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*), goal:savings_goals(*)", { count: "exact" })
    .eq("user_id", userId);

  if (filters.from) query = query.gte("transaction_date", filters.from);
  if (filters.to) query = query.lte("transaction_date", filters.to);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.minAmountCents !== undefined) query = query.gte("amount_cents", filters.minAmountCents);
  if (filters.maxAmountCents !== undefined) query = query.lte("amount_cents", filters.maxAmountCents);
  if (filters.search) {
    query = query.or(`merchant.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(fromIdx, toIdx);

  if (error) throw error;
  return {
    transactions: (data ?? []) as TransactionsResult["transactions"],
    total: count ?? 0,
  };
}

export async function getTransactionsInRange(
  supabase: SupabaseClient,
  userId: string,
  from: string,
  to: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", from)
    .lte("transaction_date", to);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getRecentTransactions(
  supabase: SupabaseClient,
  userId: string,
  limit = 8
): Promise<(Transaction & { category: Category | null; account: Account })[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as (Transaction & { category: Category | null; account: Account })[];
}
