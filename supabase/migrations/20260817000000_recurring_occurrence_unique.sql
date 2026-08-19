-- Prevent duplicate transactions from being materialized for the same
-- recurring occurrence (e.g. editing a recurring template's date or
-- toggling it active/inactive multiple times previously created dupes).
-- NULL recurring_transaction_id values are always distinct in a unique
-- index, so regular manual transactions are unaffected.

-- Clean up existing duplicates first, keeping the earliest row per occurrence.
delete from public.transactions t
using public.transactions t2
where t.recurring_transaction_id is not null
  and t.recurring_transaction_id = t2.recurring_transaction_id
  and t.transaction_date = t2.transaction_date
  and t.id > t2.id;

create unique index if not exists idx_transactions_recurring_occurrence
  on public.transactions (recurring_transaction_id, transaction_date);
