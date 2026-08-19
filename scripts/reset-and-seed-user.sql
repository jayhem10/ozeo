-- Reset all app data for a single user and reload a fresh test dataset
-- (account, transactions, recurring transactions).
-- Run this in the Supabase SQL editor.
--
-- ⚠️ DESTRUCTIVE & IRREVERSIBLE: this permanently deletes every account,
-- transaction, recurring transaction, budget, goal, import and custom
-- category owned by this user before reseeding. The profile/login itself
-- is NOT deleted. Double-check the user id below before running.
do $$
declare
  v_user_id uuid := '0ed929a4-0e2f-43df-bdd4-d134c90292bc';
  v_account_id uuid;
begin
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'No profile found for id %', v_user_id;
  end if;

  -- ── Wipe existing data (dependency order; profile itself is kept) ──────
  delete from public.imported_transactions where user_id = v_user_id;
  delete from public.imports where user_id = v_user_id;
  delete from public.savings_goal_transactions where user_id = v_user_id;
  delete from public.savings_goals where user_id = v_user_id;
  delete from public.budgets where user_id = v_user_id;
  delete from public.transactions where user_id = v_user_id;
  delete from public.recurring_transactions where user_id = v_user_id;
  delete from public.favorite_categories where user_id = v_user_id;
  delete from public.merchant_rules where user_id = v_user_id;
  delete from public.accounts where user_id = v_user_id;
  delete from public.categories where user_id = v_user_id; -- custom categories only; shared defaults (user_id is null) are untouched

  -- ── Fresh account ────────────────────────────────────────────────────
  insert into public.accounts (user_id, name, type, initial_balance_cents, current_balance_cents, icon, color)
  values (v_user_id, 'Compte courant', 'checking', 50000, 50000, 'Wallet', '#6366f1')
  returning id into v_account_id;

  -- ── Manual transactions: everything that has already happened ───────
  -- (Deliberately excludes rent/Netflix for August — those are only
  -- represented below as still-pending recurring templates.)
  insert into public.transactions (user_id, account_id, category_id, type, amount_cents, merchant, description, transaction_date)
  select v_user_id, v_account_id, c.id, v.type, v.amount_cents, v.merchant, v.description, v.transaction_date::date
  from (values
    ('Salaire',        'income',  285000, 'Entreprise SA',      'Salaire juillet',     '2026-07-01'),
    ('Logement',       'expense', 95000,  'Agence Immo',        'Loyer juillet',       '2026-07-02'),
    ('Courses',        'expense', 6200,   'Carrefour',          null,                  '2026-07-05'),
    ('Abonnements',    'expense', 1999,   'Netflix',            null,                  '2026-07-05'),
    ('Carburant',      'expense', 5400,   'Total',              null,                  '2026-07-06'),
    ('Restaurants',    'expense', 3400,   'Le Bistrot',         'Déjeuner',            '2026-07-08'),
    ('Loisirs',        'expense', 4200,   'Cinéma Pathé',       null,                  '2026-07-12'),
    ('Shopping',       'expense', 15000,  'Zara',               null,                  '2026-07-14'),
    ('Freelance',      'income',  32000,  'Client Dupont',      'Mission freelance',   '2026-07-15'),
    ('Courses',        'expense', 6700,   'Monoprix',           null,                  '2026-07-18'),
    ('Voyages',        'expense', 28000,  'Booking.com',        'Weekend',             '2026-07-20'),
    ('Cadeaux',        'expense', 4500,   'Fnac',               'Anniversaire',        '2026-07-22'),
    ('Épargne',        'expense', 20000,  'Virement épargne',   null,                  '2026-07-25'),
    ('Remboursements', 'income',  1500,   'Sécu',               'Remboursement santé', '2026-07-28'),
    ('Éducation',      'expense', 8900,   'Udemy',              'Formation en ligne',  '2026-07-30'),
    ('Salaire',        'income',  285000, 'Entreprise SA',      'Salaire août',        '2026-08-01'),
    ('Courses',        'expense', 6230,   'Carrefour',          null,                  '2026-08-03'),
    ('Carburant',      'expense', 5500,   'Total',              null,                  '2026-08-04'),
    ('Restaurants',    'expense', 3200,   'Le Bistrot',         'Déjeuner avec Julie', '2026-08-05'),
    ('Transport',      'expense', 7500,   'SNCF',               'Billet Paris-Lyon',   '2026-08-06'),
    ('Courses',        'expense', 4890,   'Monoprix',           null,                  '2026-08-08'),
    ('Loisirs',        'expense', 2500,   'Cinéma Pathé',       null,                  '2026-08-09'),
    ('Shopping',       'expense', 12000,  'Zara',               null,                  '2026-08-10'),
    ('Santé',          'expense', 3000,   'Pharmacie Centrale', 'Consultation',        '2026-08-11'),
    ('Freelance',      'income',  45000,  'Client Dupont',      'Mission ponctuelle',  '2026-08-12'),
    ('Courses',        'expense', 5670,   'Carrefour',          null,                  '2026-08-15'),
    ('Restaurants',    'expense', 4100,   'Sushi Bar',          null,                  '2026-08-16'),
    ('Autre',          'expense', 1200,   'Divers',             null,                  '2026-08-14')
  ) as v(category_name, type, amount_cents, merchant, description, transaction_date)
  join public.categories c on c.name = v.category_name and c.user_id is null;

  -- ── Recurring templates: still just templates, not yet transactions ──
  -- Loyer/Netflix/Ménage have a next_occurrence in the past (already due):
  -- "Reste à vivre" accounts for them immediately, while "Solde" only moves
  -- once you edit/toggle them in the app or the nightly cron runs.
  -- Spotify/Freelance récurrent are still ahead this month (pending).
  -- Salaire's next_occurrence is next month, so it won't show in August at all.
  insert into public.recurring_transactions (user_id, account_id, category_id, name, amount_cents, type, frequency, next_occurrence, active)
  select v_user_id, v_account_id, c.id, v.name, v.amount_cents, v.type, v.frequency, v.next_occurrence::date, true
  from (values
    ('Loyer',               'Logement',           95000,  'expense', 'monthly', '2026-08-01'),
    ('Netflix',             'Abonnements',        1999,   'expense', 'monthly', '2026-08-05'),
    ('Ménage',              'Bricolage & Maison', 4000,   'expense', 'weekly',  '2026-08-04'),
    ('Spotify',             'Abonnements',        1112,   'expense', 'monthly', '2026-08-25'),
    ('Freelance récurrent', 'Freelance',          30000,  'income',  'monthly', '2026-08-28'),
    ('Salaire',             'Salaire',            285000, 'income',  'monthly', '2026-09-01')
  ) as v(name, category_name, amount_cents, type, frequency, next_occurrence)
  join public.categories c on c.name = v.category_name and c.user_id is null;
end $$;
