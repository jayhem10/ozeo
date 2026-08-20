-- Account balances should only reflect transactions dated today or earlier —
-- future-dated ("scheduled") transactions no longer move the balance until
-- their date arrives.
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
        where account_id = target_account_id and type in ('income','expense') and transaction_date <= current_date
      ), 0)
  where id = target_account_id;

  if TG_OP = 'UPDATE' and old.account_id is distinct from new.account_id then
    update public.accounts
    set current_balance_cents = initial_balance_cents + coalesce((
          select sum(case when type = 'income' then amount_cents else -amount_cents end)
          from public.transactions
          where account_id = old.account_id and type in ('income','expense') and transaction_date <= current_date
        ), 0)
    where id = old.account_id;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- Backfill: re-run the corrected (date-filtered) calculation for every account now.
update public.accounts
set current_balance_cents = initial_balance_cents + coalesce((
      select sum(case when t.type = 'income' then t.amount_cents else -t.amount_cents end)
      from public.transactions t
      where t.account_id = accounts.id and t.type in ('income','expense') and t.transaction_date <= current_date
    ), 0);

-- The trigger above only re-fires on transaction writes, so a scheduled
-- transaction's date silently rolling from "future" to "today" wouldn't
-- otherwise update the balance. Called daily from the cron job to self-heal.
create or replace function public.recalc_all_account_balances()
returns void as $$
begin
  update public.accounts
  set current_balance_cents = initial_balance_cents + coalesce((
        select sum(case when t.type = 'income' then t.amount_cents else -t.amount_cents end)
        from public.transactions t
        where t.account_id = accounts.id and t.type in ('income','expense') and t.transaction_date <= current_date
      ), 0);
end;
$$ language plpgsql security definer set search_path = public;
