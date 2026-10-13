-- PostgREST runs with pg_safeupdate, which rejects an UPDATE without a WHERE
-- clause even inside a function called via rpc (error 21000). Add an explicit
-- `where true` so the daily balance recalc cron stops failing.
create or replace function public.recalc_all_account_balances()
returns void as $$
begin
  update public.accounts
  set current_balance_cents = initial_balance_cents + coalesce((
        select sum(case when t.type = 'income' then t.amount_cents else -t.amount_cents end)
        from public.transactions t
        where t.account_id = accounts.id and t.type in ('income','expense') and t.transaction_date <= current_date
      ), 0)
  where true;
end;
$$ language plpgsql security definer set search_path = public;
