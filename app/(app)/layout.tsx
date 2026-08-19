import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getSavingsGoals } from "@/lib/data/goals";
import { getSelectedAccountId, resolveSelectedAccountId } from "@/lib/data/account-filter";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // supabase.auth.signOut() can't write cookies from a Server Component;
    // redirect through a Route Handler that actually clears the stale session.
    redirect("/auth/clear-session?next=/login");
  }

  const profile = await getOrCreateProfile(supabase, user.id, user.email);

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [accounts, categories, goals] = await Promise.all([
    getAccounts(supabase, user.id),
    getCategories(supabase, user.id),
    getSavingsGoals(supabase, user.id),
  ]);
  const selectedAccountId = resolveSelectedAccountId(
    await getSelectedAccountId(profile.default_account_id),
    accounts
  );

  return (
    <AppShell
      profile={profile}
      accounts={accounts}
      categories={categories}
      goals={goals}
      selectedAccountId={selectedAccountId}
    >
      {children}
    </AppShell>
  );
}
