import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// Defensive fallback for accounts whose auth.users row predates the
// handle_new_user trigger (or if it ever fails silently) — never leaves the
// app stuck with a missing profile.
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<Profile> {
  const existing = await getProfile(supabase, userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, email: email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

