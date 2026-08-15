import {
  differenceInCalendarDays,
  endOfMonth,
  startOfMonth,
  addMonths,
} from "date-fns";
import type { Budget, Transaction } from "@/types/database";

export type BudgetPace = "no_budget" | "normal" | "attention" | "at_risk" | "over";

export interface BudgetProgress {
  categoryId: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  progressRatio: number; // spent / budget, can exceed 1
  timeElapsedRatio: number; // days elapsed / days in period
  pace: BudgetPace;
  forecastCents: number; // projected spend by end of period at current daily rate
}

/** Sum of expense transaction amounts (in cents) for a given category over a date range. */
export function sumExpensesByCategory(
  transactions: Pick<Transaction, "category_id" | "amount_cents" | "type">[],
  categoryId: string
): number {
  return transactions
    .filter((t) => t.type === "expense" && t.category_id === categoryId)
    .reduce((sum, t) => sum + t.amount_cents, 0);
}

/**
 * Compute budget pace/progress for a single category budget.
 * `now` and `periodStart`/`periodEnd` must be calendar dates (no time component needed).
 */
export function computeBudgetProgress(
  budget: Pick<Budget, "category_id" | "amount_cents">,
  spentCents: number,
  periodStart: Date,
  periodEnd: Date,
  now: Date = new Date()
): BudgetProgress {
  const totalDays = Math.max(1, differenceInCalendarDays(periodEnd, periodStart) + 1);
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, differenceInCalendarDays(now, periodStart) + 1)
  );
  const timeElapsedRatio = elapsedDays / totalDays;
  const progressRatio = budget.amount_cents > 0 ? spentCents / budget.amount_cents : 0;

  const dailyRate = elapsedDays > 0 ? spentCents / elapsedDays : 0;
  const forecastCents = Math.round(dailyRate * totalDays);

  let pace: BudgetPace = "normal";
  if (budget.amount_cents <= 0) {
    pace = "no_budget";
  } else if (progressRatio >= 1) {
    pace = "over";
  } else if (forecastCents > budget.amount_cents) {
    pace = "at_risk";
  } else if (progressRatio - timeElapsedRatio > 0.15) {
    pace = "attention";
  }

  return {
    categoryId: budget.category_id,
    budgetCents: budget.amount_cents,
    spentCents,
    remainingCents: budget.amount_cents - spentCents,
    progressRatio,
    timeElapsedRatio,
    pace,
    forecastCents,
  };
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getPreviousMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const prev = addMonths(date, -1);
  return { start: startOfMonth(prev), end: endOfMonth(prev) };
}

export interface PeriodTotals {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  savingsRate: number; // net / income, 0 if income is 0
}

export function computePeriodTotals(
  transactions: Pick<Transaction, "type" | "amount_cents">[]
): PeriodTotals {
  const incomeCents = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const expenseCents = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const netCents = incomeCents - expenseCents;
  const savingsRate = incomeCents > 0 ? netCents / incomeCents : 0;
  return { incomeCents, expenseCents, netCents, savingsRate };
}

/** Percentage change from `previous` to `current`, guarding against division by zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

export interface GoalProjection {
  remainingCents: number;
  progressRatio: number;
  monthsToTarget: number | null; // null if contribution is 0 or goal already reached
  estimatedCompletionDate: Date | null;
  isReached: boolean;
}

export function computeGoalProjection(
  targetCents: number,
  currentCents: number,
  monthlyContributionCents: number | null,
  now: Date = new Date()
): GoalProjection {
  const remainingCents = Math.max(0, targetCents - currentCents);
  const progressRatio = targetCents > 0 ? Math.min(1, currentCents / targetCents) : 0;
  const isReached = remainingCents === 0;

  if (isReached || !monthlyContributionCents || monthlyContributionCents <= 0) {
    return {
      remainingCents,
      progressRatio,
      monthsToTarget: isReached ? 0 : null,
      estimatedCompletionDate: isReached ? now : null,
      isReached,
    };
  }

  const monthsToTarget = Math.ceil(remainingCents / monthlyContributionCents);
  return {
    remainingCents,
    progressRatio,
    monthsToTarget,
    estimatedCompletionDate: addMonths(now, monthsToTarget),
    isReached: false,
  };
}

/** Recommended amount left to spend per remaining day of the period. */
export function computeDailyAllowance(
  remainingBudgetCents: number,
  periodEnd: Date,
  now: Date = new Date()
): number {
  const daysLeft = Math.max(1, differenceInCalendarDays(periodEnd, now) + 1);
  return Math.max(0, Math.round(remainingBudgetCents / daysLeft));
}
