import { LogOut } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getCategories } from "@/lib/data/categories";
import { getAccounts } from "@/lib/data/accounts";
import { signOut } from "@/lib/actions/profile";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { CategoryManager } from "@/components/settings/category-manager";
import { DangerZone } from "@/components/settings/danger-zone";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, categories, accounts] = await Promise.all([
    getOrCreateProfile(supabase, user.id, user.email),
    getCategories(supabase, user.id),
    getAccounts(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Paramètres" description="Profil, catégories et préférences." />
      <ProfileForm profile={profile} accounts={accounts} />
      <CategoryManager categories={categories} />
      <div className="flex items-center justify-between rounded-2xl border p-5">
        <div>
          <p className="font-medium">Session</p>
          <p className="text-sm text-muted-foreground">Connecté en tant que {profile.email}.</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <LogOut className="size-4" />
            Se déconnecter
          </Button>
        </form>
      </div>
      <DangerZone />
    </div>
  );
}
