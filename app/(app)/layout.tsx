import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getSavingsGoals } from "@/lib/data/goals";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getOrCreateProfile(supabase, user.id, user.email);

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [accounts, categories, goals] = await Promise.all([
    getAccounts(supabase, user.id),
    getCategories(supabase, user.id),
    getSavingsGoals(supabase, user.id),
  ]);

  return (
    <AppShell profile={profile} accounts={accounts} categories={categories} goals={goals}>
      {children}
    </AppShell>
  );
}
