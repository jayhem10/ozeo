// Hand-written types mirroring supabase/migrations. Amounts are stored as
// integer cents (bigint) in Postgres to avoid floating point errors.

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "credit_card"
  | "investment"
  | "other";

export type CategoryType = "expense" | "income";

export type TransactionType = "expense" | "income" | "transfer";

export type BudgetPeriod = "monthly" | "yearly" | "custom";

export type RecurringFrequency = "weekly" | "monthly" | "yearly" | "custom";

export type ImportStatus = "pending" | "imported" | "duplicate" | "failed" | "skipped";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  locale: string;
  timezone: string;
  onboarding_completed: boolean;
  monthly_budget_cents: number | null;
  default_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance_cents: number;
  current_balance_cents: number;
  currency: string;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  monthly_budget_cents: number | null;
  created_at: string;
  // Computed from favorite_categories, not a column on this table.
  is_favorite?: boolean;
}

export type GoalImpact = "contribution" | "withdrawal";

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount_cents: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  transaction_date: string;
  notes: string | null;
  is_recurring: boolean;
  recurring_transaction_id: string | null;
  goal_id: string | null;
  goal_impact: GoalImpact | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount_cents: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  rollover: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  name: string;
  amount_cents: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  interval_days: number | null;
  next_occurrence: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount_cents: number;
  current_amount_cents: number;
  target_date: string | null;
  icon: string;
  color: string;
  monthly_contribution_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalTransaction {
  id: string;
  goal_id: string;
  user_id: string;
  amount_cents: number;
  transaction_date: string;
  note: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface Import {
  id: string;
  user_id: string;
  filename: string;
  source: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  created_at: string;
}

export interface ImportedTransaction {
  id: string;
  user_id: string;
  import_id: string;
  external_reference: string | null;
  raw_data: Record<string, unknown>;
  status: ImportStatus;
  transaction_id: string | null;
  created_at: string;
}

export interface MerchantRule {
  id: string;
  user_id: string | null;
  pattern: string;
  category_id: string;
  created_at: string;
}

// Joined shapes used across the app
export interface TransactionWithRelations extends Transaction {
  category: Category | null;
  account: Account;
}
