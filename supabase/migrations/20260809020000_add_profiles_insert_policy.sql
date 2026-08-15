-- getOrCreateProfile() (lib/data/profile.ts) inserts a profiles row from a
-- request-scoped client (subject to RLS, unlike the security-definer trigger),
-- so an insert policy is required for that fallback path to work.
create policy "profiles_insert_own" on public.profiles for insert
  with check (auth.uid() = id);
