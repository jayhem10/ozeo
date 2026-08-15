-- Ozeo — initial schema
-- Monetary values are stored as integer cents (bigint) to avoid floating point errors.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  currency text not null default 'EUR',
  locale text not null default 'fr-FR',
  timezone text not null default 'Europe/Paris',
  onboarding_completed boolean not null default false,
  monthly_budget_cents bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- accounts
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','cash','credit_card','investment','other')),
  initial_balance_cents bigint not null default 0,
  current_balance_cents bigint not null default 0,
  currency text not null default 'EUR',
  icon text not null default 'Wallet',
  color text not null default '#6366f1',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- categories (user_id null = system default category, visible to everyone)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default 'Tag',
  color text not null default '#6366f1',
  type text not null check (type in ('expense','income')),
  is_default boolean not null default false,
  monthly_budget_cents bigint,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- transactions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('expense','income','transfer')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'EUR',
  description text,
  merchant text,
  transaction_date date not null default current_date,
  notes text,
  is_recurring boolean not null default false,
  recurring_transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- budgets
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  period text not null default 'monthly' check (period in ('monthly','yearly','custom')),
  start_date date not null default date_trunc('month', current_date),
  end_date date,
  rollover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, period)
);

-- ─────────────────────────────────────────────────────────────────────────
-- recurring_transactions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount_cents bigint not null check (amount_cents > 0),
  type text not null check (type in ('expense','income')),
  frequency text not null check (frequency in ('weekly','monthly','yearly','custom')),
  interval_days int,
  next_occurrence date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add constraint transactions_recurring_fk
  foreign key (recurring_transaction_id) references public.recurring_transactions(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────
-- savings_goals
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount_cents bigint not null check (target_amount_cents > 0),
  current_amount_cents bigint not null default 0,
  target_date date,
  icon text not null default 'Target',
  color text not null default '#6366f1',
  monthly_contribution_cents bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_goal_transactions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents bigint not null,
  transaction_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- CSV import
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  source text not null default 'csv',
  total_rows int not null default 0,
  imported_rows int not null default 0,
  failed_rows int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.imported_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  external_reference text,
  raw_data jsonb not null,
  status text not null default 'pending' check (status in ('pending','imported','duplicate','failed','skipped')),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Merchant → category suggestion rules (user_id null = built-in rule)
create table if not exists public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  pattern text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date);
create index if not exists idx_transactions_category on public.transactions(category_id);
create index if not exists idx_transactions_account on public.transactions(account_id);
create index if not exists idx_transactions_recurring on public.transactions(recurring_transaction_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_budgets_user on public.budgets(user_id);
create index if not exists idx_recurring_user on public.recurring_transactions(user_id);
create index if not exists idx_recurring_next on public.recurring_transactions(next_occurrence);
create index if not exists idx_goals_user on public.savings_goals(user_id);
create index if not exists idx_goal_tx_goal on public.savings_goal_transactions(goal_id);
create index if not exists idx_imports_user on public.imports(user_id);
create index if not exists idx_imported_tx_import on public.imported_transactions(import_id);

-- Lets ON CONFLICT dedupe system categories (user_id is null) by name/type
create unique index if not exists categories_system_name_type_key
  on public.categories(name, type) where user_id is null;


-- ─────────────────────────────────────────────────────────────────────────
-- updated_at trigger helper
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.recurring_transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.savings_goals
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Auto-create profile when a Supabase Auth user signs up
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- Keep accounts.current_balance_cents in sync with their transactions
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.recalc_account_balance()
returns trigger as $$
declare
  target_account_id uuid;
begin
  target_account_id := coalesce(new.account_id, old.account_id);

  update public.accounts
  set current_balance_cents = initial_balance_cents + coalesce((
        select sum(case when type = 'income' then amount_cents else -amount_cents end)
        from public.transactions
        where account_id = target_account_id and type in ('income','expense')
      ), 0)
  where id = target_account_id;

  if TG_OP = 'UPDATE' and old.account_id is distinct from new.account_id then
    update public.accounts
    set current_balance_cents = initial_balance_cents + coalesce((
          select sum(case when type = 'income' then amount_cents else -amount_cents end)
          from public.transactions
          where account_id = old.account_id and type in ('income','expense')
        ), 0)
    where id = old.account_id;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_transaction_change
  after insert or update or delete on public.transactions
  for each row execute function public.recalc_account_balance();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_goal_transactions enable row level security;
alter table public.imports enable row level security;
alter table public.imported_transactions enable row level security;
alter table public.merchant_rules enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "accounts_all_own" on public.accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_select" on public.categories for select
  using (auth.uid() = user_id or (user_id is null and is_default = true));
create policy "categories_insert_own" on public.categories for insert
  with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete
  using (auth.uid() = user_id);

create policy "transactions_all_own" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets_all_own" on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_all_own" on public.recurring_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.savings_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goal_tx_all_own" on public.savings_goal_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "imports_all_own" on public.imports for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "imported_tx_all_own" on public.imported_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "merchant_rules_select" on public.merchant_rules for select
  using (auth.uid() = user_id or user_id is null);
create policy "merchant_rules_all_own" on public.merchant_rules for insert
  with check (auth.uid() = user_id);
create policy "merchant_rules_update_own" on public.merchant_rules for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "merchant_rules_delete_own" on public.merchant_rules for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Default system categories (visible to every user, user_id is null)
-- ─────────────────────────────────────────────────────────────────────────
insert into public.categories (name, icon, color, type, is_default) values
  ('Logement', 'Home', '#f97316', 'expense', true),
  ('Courses', 'ShoppingCart', '#22c55e', 'expense', true),
  ('Restaurants', 'UtensilsCrossed', '#ef4444', 'expense', true),
  ('Transport', 'Car', '#3b82f6', 'expense', true),
  ('Carburant', 'Fuel', '#eab308', 'expense', true),
  ('Loisirs', 'Clapperboard', '#a855f7', 'expense', true),
  ('Shopping', 'ShoppingBag', '#ec4899', 'expense', true),
  ('Santé', 'HeartPulse', '#14b8a6', 'expense', true),
  ('Abonnements', 'RefreshCcw', '#6366f1', 'expense', true),
  ('Voyages', 'Plane', '#0ea5e9', 'expense', true),
  ('Cadeaux', 'Gift', '#f43f5e', 'expense', true),
  ('Éducation', 'GraduationCap', '#8b5cf6', 'expense', true),
  ('Épargne', 'PiggyBank', '#10b981', 'expense', true),
  ('Autre', 'MoreHorizontal', '#6b7280', 'expense', true),
  ('Salaire', 'Wallet', '#22c55e', 'income', true),
  ('Freelance', 'Briefcase', '#3b82f6', 'income', true),
  ('Remboursements', 'Undo2', '#14b8a6', 'income', true),
  ('Autres revenus', 'PlusCircle', '#6b7280', 'income', true)
on conflict (name, type) where user_id is null do nothing;
