"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  profileFormSchema,
  onboardingSchema,
  type ProfileFormValues,
  type OnboardingValues,
} from "@/lib/validations/schemas";
import { toCents } from "@/lib/money";
import { SELECTED_ACCOUNT_COOKIE } from "@/lib/data/account-filter";
import type { ActionResult } from "@/lib/actions/transactions";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

export async function updateProfile(values: ProfileFormValues): Promise<ActionResult> {
  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name || null,
      currency: v.currency,
      locale: v.locale,
      timezone: v.timezone,
      monthly_budget_cents: v.monthly_budget != null ? toCents(v.monthly_budget) : null,
      default_account_id: v.default_account_id || null,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  // Clear any header override so the newly saved default takes effect right away.
  const store = await cookies();
  store.delete(SELECTED_ACCOUNT_COOKIE);

  // "layout" also refreshes the (app) layout that renders the header's account switcher.
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function completeOnboarding(values: OnboardingValues): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { supabase, user } = await requireUser();
  const v = parsed.data;

  const { error: accountError } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: v.account_name,
    type: "checking",
    initial_balance_cents: toCents(v.initial_balance),
    current_balance_cents: toCents(v.initial_balance),
    currency: v.currency,
    icon: "Wallet",
    color: "#6366f1",
  });
  if (accountError) return { success: false, error: accountError.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      currency: v.currency,
      onboarding_completed: true,
      monthly_budget_cents: v.monthly_budget != null ? toCents(v.monthly_budget) : null,
    })
    .eq("id", user.id);
  if (profileError) return { success: false, error: profileError.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteOwnAccount(): Promise<ActionResult> {
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const store = await cookies();
  store.delete(SELECTED_ACCOUNT_COOKIE);
  redirect("/login");
}
