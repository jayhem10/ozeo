-- ─────────────────────────────────────────────────────────────────────────
-- profiles.default_account_id — preferred account view when the user hasn't
-- picked one for the current session (null = "Tous les comptes").
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists default_account_id uuid references public.accounts(id) on delete set null;
