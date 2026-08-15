import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { OnboardingWizard } from "@/components/settings/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Clears any stale session cookie so proxy's optimistic check stops bouncing back here.
    await supabase.auth.signOut();
    redirect("/login");
  }

  const profile = await getOrCreateProfile(supabase, user.id, user.email);
  if (profile.onboarding_completed) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <OnboardingWizard />
    </div>
  );
}
