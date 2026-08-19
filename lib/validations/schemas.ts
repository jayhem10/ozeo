import { z } from "zod";

export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "other",
]);

export const categoryTypeSchema = z.enum(["expense", "income"]);
export const transactionTypeSchema = z.enum(["expense", "income", "transfer"]);
export const budgetPeriodSchema = z.enum(["monthly", "yearly", "custom"]);
export const recurringFrequencySchema = z.enum(["weekly", "monthly", "yearly", "custom"]);

export const goalImpactSchema = z.enum(["contribution", "withdrawal"]);

export const transactionFormSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.coerce.number().positive("Le montant doit être positif"),
    account_id: z.string().uuid("Compte requis"),
    category_id: z.string().min(1, "Catégorie requise").uuid("Catégorie requise"),
    transaction_date: z.string().min(1, "Date requise"),
    merchant: z.string().max(120).optional().or(z.literal("")),
    description: z.string().max(200).optional().or(z.literal("")),
    notes: z.string().max(1000).optional().or(z.literal("")),
    goal_id: z.string().uuid().nullable().optional(),
    goal_impact: goalImpactSchema.nullable().optional(),
  })
  .refine((v) => !v.goal_id || !!v.goal_impact, {
    message: "Précise si cette transaction alimente ou utilise l'objectif",
    path: ["goal_impact"],
  });
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const accountFormSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  type: accountTypeSchema,
  initial_balance: z.coerce.number(),
  currency: z.string().length(3).default("EUR"),
  icon: z.string().min(1).default("Wallet"),
  color: z.string().min(1).default("#6366f1"),
});
export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  icon: z.string().min(1),
  color: z.string().min(1),
  type: categoryTypeSchema,
  monthly_budget: z.coerce.number().nonnegative().nullable().optional(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const budgetFormSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.coerce.number().positive("Le budget doit être positif"),
  period: budgetPeriodSchema.default("monthly"),
  rollover: z.boolean().default(false),
});
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const recurringFormSchema = z.object({
  name: z.string().min(1, "Nom requis").max(80),
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  type: z.enum(["expense", "income"]),
  frequency: recurringFrequencySchema,
  next_occurrence: z.string().min(1, "Date requise"),
  active: z.boolean().default(true),
});
export type RecurringFormValues = z.infer<typeof recurringFormSchema>;

export const goalFormSchema = z.object({
  name: z.string().min(1, "Nom requis").max(80),
  target_amount: z.coerce.number().positive("L'objectif doit être positif"),
  current_amount: z.coerce.number().nonnegative().default(0),
  target_date: z.string().optional().or(z.literal("")),
  icon: z.string().min(1).default("Target"),
  color: z.string().min(1).default("#6366f1"),
  monthly_contribution: z.coerce.number().nonnegative().nullable().optional(),
});
export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const goalContributionSchema = z.object({
  amount: z.coerce.number().refine((v) => v !== 0, "Montant requis"),
  note: z.string().max(200).optional().or(z.literal("")),
});
export type GoalContributionValues = z.infer<typeof goalContributionSchema>;

export const profileFormSchema = z.object({
  full_name: z.string().max(80).optional().or(z.literal("")),
  currency: z.string().length(3),
  locale: z.string().min(2),
  timezone: z.string().min(1),
  monthly_budget: z.coerce.number().nonnegative().nullable().optional(),
  default_account_id: z.string().uuid().nullable().optional(),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const onboardingSchema = z.object({
  currency: z.string().length(3).default("EUR"),
  account_name: z.string().min(1).max(60).default("Compte courant"),
  initial_balance: z.coerce.number().default(0),
  monthly_budget: z.coerce.number().nonnegative().optional(),
});
export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const csvMappingSchema = z.object({
  dateColumn: z.string().min(1, "Colonne date requise"),
  amountColumn: z.string().min(1, "Colonne montant requise"),
  descriptionColumn: z.string().optional(),
  merchantColumn: z.string().optional(),
  accountId: z.string().uuid("Compte requis"),
  dateFormat: z.enum(["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy"]),
});
export type CsvMappingValues = z.infer<typeof csvMappingSchema>;
