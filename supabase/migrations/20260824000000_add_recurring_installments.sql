-- Support recurring templates with a limited number of installments
-- (e.g. "3x100€"): once occurrences_count reaches total_occurrences the
-- template is auto-deactivated by the generation job / materializer.
alter table public.recurring_transactions
  add column if not exists total_occurrences int check (total_occurrences > 0),
  add column if not exists occurrences_count int not null default 0 check (occurrences_count >= 0);
