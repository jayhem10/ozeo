"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recurringFormSchema, type RecurringFormValues } from "@/lib/validations/schemas";
import { toCents } from "@/lib/money";
import type { ActionResult } from "@/lib/actions/transactions";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

export async function createRecurring(values: RecurringFormValues): Promise<ActionResult> {
  const parsed = recurringFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
    account_id: v.account_id,
    category_id: v.category_id || null,
    name: v.name,
    amount_cents: toCents(v.amount),
    type: v.type,
    frequency: v.frequency,
    next_occurrence: v.next_occurrence,
    active: v.active,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { success: true };
}

export async function updateRecurring(id: string, values: RecurringFormValues): Promise<ActionResult> {
  const parsed = recurringFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      account_id: v.account_id,
      category_id: v.category_id || null,
      name: v.name,
      amount_cents: toCents(v.amount),
      type: v.type,
      frequency: v.frequency,
      next_occurrence: v.next_occurrence,
      active: v.active,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { success: true };
}

export async function toggleRecurringActive(id: string, active: boolean): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/recurring");
  return { success: true };
}
