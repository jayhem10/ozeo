-- Link transactions to savings goals so a single expense/income can feed
-- ("contribution") or draw from ("withdrawal") a goal automatically.

alter table public.transactions
  add column if not exists goal_id uuid references public.savings_goals(id) on delete set null,
  add column if not exists goal_impact text check (goal_impact in ('contribution', 'withdrawal'));

alter table public.transactions
  add constraint transactions_goal_impact_requires_goal
  check ((goal_id is null) = (goal_impact is null));

-- Trace which transaction produced a given goal contribution/withdrawal so it
-- can be reverted when that transaction is edited or deleted.
alter table public.savings_goal_transactions
  add column if not exists transaction_id uuid references public.transactions(id) on delete cascade;

create index if not exists idx_transactions_goal on public.transactions(goal_id);
create index if not exists idx_goal_tx_transaction on public.savings_goal_transactions(transaction_id);
