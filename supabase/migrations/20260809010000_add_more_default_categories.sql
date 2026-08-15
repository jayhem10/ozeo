-- Additional default categories, more granular than the initial seed set.
-- Relies on the categories_system_name_type_key partial unique index
-- (see 20260809000000_init.sql) so re-running this migration is idempotent.

-- ─────────────────────────────────────────────────────────────────────────
-- Additional expense categories
-- ─────────────────────────────────────────────────────────────────────────
insert into public.categories (name, icon, color, type, is_default) values
  ('Assurances', 'ShieldCheck', '#0891b2', 'expense', true),
  ('Impôts & Taxes', 'Landmark', '#7c3aed', 'expense', true),
  ('Frais bancaires', 'CreditCard', '#64748b', 'expense', true),
  ('Sport & Bien-être', 'Dumbbell', '#06b6d4', 'expense', true),
  ('Entretien véhicule', 'Wrench', '#ca8a04', 'expense', true),
  ('Bricolage & Maison', 'Hammer', '#92400e', 'expense', true),
  ('Dons', 'HandHeart', '#db2777', 'expense', true),
  ('Animaux', 'PawPrint', '#65a30d', 'expense', true),
  ('Enfants', 'Baby', '#f472b6', 'expense', true),
  ('Van & Camping', 'Caravan', '#0d9488', 'expense', true),
  ('Électronique & High-tech', 'Laptop', '#4f46e5', 'expense', true),
  ('Beauté & Cosmétique', 'Sparkles', '#d946ef', 'expense', true),
  ('Alcool & Tabac', 'Wine', '#78350f', 'expense', true),
  ('Culture & Divertissement', 'Ticket', '#9333ea', 'expense', true),
  ('Coiffeur & Soins personnels', 'Scissors', '#f59e0b', 'expense', true),
  ('Frais professionnels', 'Briefcase', '#475569', 'expense', true),
  ('Impayés & Pénalités', 'AlertCircle', '#dc2626', 'expense', true)
on conflict (name, type) where user_id is null do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Additional income categories
-- ─────────────────────────────────────────────────────────────────────────
insert into public.categories (name, icon, color, type, is_default) values
  ('Investissements', 'TrendingUp', '#16a34a', 'income', true),
  ('Revenus locatifs', 'Building2', '#0284c7', 'income', true),
  ('Aides & Allocations', 'HandCoins', '#ea580c', 'income', true),
  ('Vente d''occasion', 'Tag', '#be185d', 'income', true),
  ('Pension & Retraite', 'Landmark', '#4d7c0f', 'income', true),
  ('Bourses & Aides études', 'GraduationCap', '#0e7490', 'income', true),
  ('Prime & Bonus', 'Award', '#c026d3', 'income', true),
  ('Vente immobilière', 'Home', '#b45309', 'income', true),
  ('Héritage', 'Landmark', '#1d4ed8', 'income', true),
  ('Cadeaux reçus', 'Gift', '#059669', 'income', true)
on conflict (name, type) where user_id is null do nothing;
