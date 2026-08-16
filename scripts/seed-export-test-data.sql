-- Test dataset to exercise the Excel export (calendar page) for a given user.
-- Run this in the Supabase SQL editor. Re-running will insert duplicate rows.
do $$
declare
  v_user_id uuid := '0ed929a4-0e2f-43df-bdd4-d134c90292bc';
  v_account_id uuid;
begin
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'No profile found for id %', v_user_id;
  end if;

  select id into v_account_id from public.accounts where user_id = v_user_id order by created_at limit 1;

  if v_account_id is null then
    insert into public.accounts (user_id, name, type, initial_balance_cents, current_balance_cents, icon, color)
    values (v_user_id, 'Compte courant (test)', 'checking', 200000, 200000, 'Wallet', '#6366f1')
    returning id into v_account_id;
  end if;

  insert into public.transactions (user_id, account_id, category_id, type, amount_cents, merchant, description, transaction_date)
  select v_user_id, v_account_id, c.id, v.type, v.amount_cents, v.merchant, v.description, v.transaction_date::date
  from (values
    ('Salaire',        'income',  280000, 'Entreprise SA',      'Salaire mensuel',     '2026-08-01'),
    ('Logement',       'expense', 95000,  'Agence Immo',        'Loyer août',          '2026-08-02'),
    ('Courses',        'expense', 6230,   'Carrefour',          null,                  '2026-08-03'),
    ('Carburant',      'expense', 5500,   'Total',              null,                  '2026-08-04'),
    ('Restaurants',    'expense', 3200,   'Le Bistrot',         'Déjeuner avec Julie', '2026-08-05'),
    ('Abonnements',    'expense', 1999,   'Netflix',            null,                  '2026-08-05'),
    ('Transport',      'expense', 7500,   'SNCF',               'Billet Paris-Lyon',   '2026-08-06'),
    ('Courses',        'expense', 4890,   'Monoprix',           null,                  '2026-08-08'),
    ('Loisirs',        'expense', 2500,   'Cinéma Pathé',       null,                  '2026-08-09'),
    ('Shopping',       'expense', 12000,  'Zara',               null,                  '2026-08-10'),
    ('Santé',          'expense', 3000,   'Pharmacie Centrale', 'Consultation',        '2026-08-11'),
    ('Freelance',      'income',  45000,  'Client Dupont',      'Mission ponctuelle',  '2026-08-12'),
    ('Courses',        'expense', 5670,   'Carrefour',          null,                  '2026-08-15'),
    ('Restaurants',    'expense', 4100,   'Sushi Bar',          null,                  '2026-08-16'),
    ('Voyages',        'expense', 32000,  'Booking.com',        'Hôtel weekend',       '2026-07-20'),
    ('Cadeaux',        'expense', 4500,   'Fnac',               'Anniversaire Léo',    '2026-07-22'),
    ('Épargne',        'expense', 20000,  'Virement épargne',   null,                  '2026-07-25'),
    ('Remboursements',  'income', 1500,   'Sécu',               'Remboursement santé', '2026-07-28'),
    ('Éducation',      'expense', 8900,   'Udemy',              'Formation en ligne',  '2026-07-30'),
    ('Autre',          'expense', 1200,   'Divers',             null,                  '2026-08-14')
  ) as v(category_name, type, amount_cents, merchant, description, transaction_date)
  join public.categories c on c.name = v.category_name and c.user_id is null;
end $$;
