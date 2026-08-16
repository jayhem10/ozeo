-- ─────────────────────────────────────────────────────────────────────────
-- favorite_categories (per-user pins, incl. shared default categories)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.favorite_categories (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index if not exists idx_favorite_categories_user on public.favorite_categories(user_id);

alter table public.favorite_categories enable row level security;

create policy "favorite_categories_all_own" on public.favorite_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
