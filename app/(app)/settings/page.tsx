import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { CategoryManager } from "@/components/settings/category-manager";
import { DangerZone } from "@/components/settings/danger-zone";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, categories] = await Promise.all([
    getOrCreateProfile(supabase, user.id, user.email),
    getCategories(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Paramètres" description="Profil, catégories et préférences." />
      <ProfileForm profile={profile} />
      <CategoryManager categories={categories} />
      <DangerZone />
    </div>
  );
}
