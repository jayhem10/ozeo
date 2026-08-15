"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/schemas";
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

export async function createCategory(values: CategoryFormValues): Promise<ActionResult> {
  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: v.name,
    icon: v.icon,
    color: v.color,
    type: v.type,
    is_default: false,
    monthly_budget_cents: v.monthly_budget != null ? toCents(v.monthly_budget) : null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/budgets");
  return { success: true };
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<ActionResult> {
  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase
    .from("categories")
    .update({
      name: v.name,
      icon: v.icon,
      color: v.color,
      monthly_budget_cents: v.monthly_budget != null ? toCents(v.monthly_budget) : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/budgets");
  return { success: true };
}
