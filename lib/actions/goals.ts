"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  goalFormSchema,
  goalContributionSchema,
  type GoalFormValues,
  type GoalContributionValues,
} from "@/lib/validations/schemas";
import { toCents } from "@/lib/money";
import type { ActionResult } from "@/lib/actions/transactions";
import type { GoalImpact } from "@/types/database";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

// A transaction linked to a goal either feeds it ("contribution", +) or draws
// from money already saved for it ("withdrawal", -). Kept in sync here rather
// than via a DB trigger, since goals.current_amount_cents can also be edited
// directly (see updateGoal/contributeToGoal).
export async function applyGoalTransactionImpact(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  impact: GoalImpact,
  amountCents: number,
  transactionId: string,
  note: string | null
) {
  const delta = impact === "contribution" ? amountCents : -amountCents;
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_amount_cents")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();
  if (!goal) return;

  await supabase
    .from("savings_goals")
    .update({ current_amount_cents: goal.current_amount_cents + delta })
    .eq("id", goalId)
    .eq("user_id", userId);

  await supabase.from("savings_goal_transactions").insert({
    goal_id: goalId,
    user_id: userId,
    amount_cents: delta,
    transaction_id: transactionId,
    note,
  });
}

// Reverses applyGoalTransactionImpact, used when the linked transaction is
// edited (goal/amount changed) or deleted.
export async function revertGoalTransactionImpact(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  impact: GoalImpact,
  amountCents: number,
  transactionId: string
) {
  const delta = impact === "contribution" ? amountCents : -amountCents;
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_amount_cents")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();
  if (goal) {
    await supabase
      .from("savings_goals")
      .update({ current_amount_cents: goal.current_amount_cents - delta })
      .eq("id", goalId)
      .eq("user_id", userId);
  }
  await supabase.from("savings_goal_transactions").delete().eq("transaction_id", transactionId);
}

export async function createGoal(values: GoalFormValues): Promise<ActionResult> {
  const parsed = goalFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: v.name,
    target_amount_cents: toCents(v.target_amount),
    current_amount_cents: toCents(v.current_amount),
    target_date: v.target_date || null,
    icon: v.icon,
    color: v.color,
    monthly_contribution_cents: v.monthly_contribution != null ? toCents(v.monthly_contribution) : null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoal(id: string, values: GoalFormValues): Promise<ActionResult> {
  const parsed = goalFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase
    .from("savings_goals")
    .update({
      name: v.name,
      target_amount_cents: toCents(v.target_amount),
      target_date: v.target_date || null,
      icon: v.icon,
      color: v.color,
      monthly_contribution_cents: v.monthly_contribution != null ? toCents(v.monthly_contribution) : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function contributeToGoal(
  goalId: string,
  values: GoalContributionValues
): Promise<ActionResult> {
  const parsed = goalContributionSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;
  const amountCents = toCents(v.amount);

  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("current_amount_cents")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();
  if (goalError || !goal) return { success: false, error: "Objectif introuvable" };

  const { error: insertError } = await supabase.from("savings_goal_transactions").insert({
    goal_id: goalId,
    user_id: user.id,
    amount_cents: amountCents,
    note: v.note || null,
  });
  if (insertError) return { success: false, error: insertError.message };

  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({ current_amount_cents: goal.current_amount_cents + amountCents })
    .eq("id", goalId)
    .eq("user_id", user.id);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}
