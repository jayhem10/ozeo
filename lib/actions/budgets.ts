"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { budgetFormSchema, type BudgetFormValues } from "@/lib/validations/schemas";
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

export async function upsertBudget(values: BudgetFormValues): Promise<ActionResult> {
  const parsed = budgetFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const startDate = new Date();
  startDate.setDate(1);

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category_id: v.category_id,
        amount_cents: toCents(v.amount),
        period: v.period,
        start_date: format(startDate, "yyyy-MM-dd"),
        rollover: v.rollover,
      },
      { onConflict: "user_id,category_id,period" }
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}
