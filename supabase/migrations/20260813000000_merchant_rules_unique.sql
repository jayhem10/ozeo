-- Let user-specific merchant rules be upserted (one rule per merchant pattern
-- per user), so correcting a transaction's category teaches future imports
-- and quick-add suggestions.
alter table public.merchant_rules
  add constraint merchant_rules_user_pattern_key unique (user_id, pattern);
