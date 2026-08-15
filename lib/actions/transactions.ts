"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { transactionFormSchema, type TransactionFormValues } from "@/lib/validations/schemas";
import { toCents } from "@/lib/money";
import { applyGoalTransactionImpact, revertGoalTransactionImpact } from "@/lib/actions/goals";
import { normalizeMerchantPattern } from "@/lib/categorization";
import type { GoalImpact } from "@/types/database";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/accounts");
  revalidatePath("/goals");
}

// Learns from a manual categorization so future CSV imports / suggestions
// pick the same category for that merchant.
async function rememberMerchantRule(
  supabase: SupabaseClient,
  userId: string,
  merchant: string | null,
  categoryId: string | null
) {
  if (!merchant || !categoryId) return;
  await supabase
    .from("merchant_rules")
    .upsert(
      { user_id: userId, pattern: normalizeMerchantPattern(merchant), category_id: categoryId },
      { onConflict: "user_id,pattern" }
    );
}

export async function createTransaction(values: TransactionFormValues): Promise<ActionResult> {
  const parsed = transactionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: v.account_id,
      category_id: v.category_id || null,
      type: v.type,
      amount_cents: toCents(v.amount),
      description: v.description || null,
      merchant: v.merchant || null,
      transaction_date: v.transaction_date,
      notes: v.notes || null,
      goal_id: v.goal_id || null,
      goal_impact: v.goal_id ? v.goal_impact ?? null : null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await rememberMerchantRule(supabase, user.id, v.merchant || null, v.category_id);

  if (v.goal_id && v.goal_impact) {
    await applyGoalTransactionImpact(
      supabase,
      user.id,
      v.goal_id,
      v.goal_impact,
      toCents(v.amount),
      inserted.id,
      v.description || v.merchant || null
    );
  }

  revalidateAll();
  return { success: true };
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues
): Promise<ActionResult> {
  const parsed = transactionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { data: previous } = await supabase
    .from("transactions")
    .select("goal_id, goal_impact, amount_cents")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: v.account_id,
      category_id: v.category_id || null,
      type: v.type,
      amount_cents: toCents(v.amount),
      description: v.description || null,
      merchant: v.merchant || null,
      transaction_date: v.transaction_date,
      notes: v.notes || null,
      goal_id: v.goal_id || null,
      goal_impact: v.goal_id ? v.goal_impact ?? null : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  await rememberMerchantRule(supabase, user.id, v.merchant || null, v.category_id);

  if (previous?.goal_id && previous.goal_impact) {
    await revertGoalTransactionImpact(
      supabase,
      user.id,
      previous.goal_id,
      previous.goal_impact as GoalImpact,
      previous.amount_cents,
      id
    );
  }
  if (v.goal_id && v.goal_impact) {
    await applyGoalTransactionImpact(
      supabase,
      user.id,
      v.goal_id,
      v.goal_impact,
      toCents(v.amount),
      id,
      v.description || v.merchant || null
    );
  }

  revalidateAll();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { data: previous } = await supabase
    .from("transactions")
    .select("goal_id, goal_impact, amount_cents")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  if (previous?.goal_id && previous.goal_impact) {
    await revertGoalTransactionImpact(
      supabase,
      user.id,
      previous.goal_id,
      previous.goal_impact as GoalImpact,
      previous.amount_cents,
      id
    );
  }

  revalidateAll();
  return { success: true };
}

export async function duplicateTransaction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { data: original, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !original) return { success: false, error: "Transaction introuvable" };

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      account_id: original.account_id,
      category_id: original.category_id,
      type: original.type,
      amount_cents: original.amount_cents,
      description: original.description,
      merchant: original.merchant,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      notes: original.notes,
      goal_id: original.goal_id,
      goal_impact: original.goal_impact,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (original.goal_id && original.goal_impact) {
    await applyGoalTransactionImpact(
      supabase,
      user.id,
      original.goal_id,
      original.goal_impact as GoalImpact,
      original.amount_cents,
      inserted.id,
      original.description || original.merchant || null
    );
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  return { success: true };
}
