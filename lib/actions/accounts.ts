"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountFormSchema, type AccountFormValues } from "@/lib/validations/schemas";
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

export async function createAccount(values: AccountFormValues): Promise<ActionResult> {
  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: v.name,
    type: v.type,
    initial_balance_cents: toCents(v.initial_balance),
    current_balance_cents: toCents(v.initial_balance),
    currency: v.currency,
    icon: v.icon,
    color: v.color,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAccount(id: string, values: AccountFormValues): Promise<ActionResult> {
  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase
    .from("accounts")
    .update({ name: v.name, type: v.type, currency: v.currency, icon: v.icon, color: v.color })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveAccount(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("accounts")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}
