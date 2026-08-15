import { differenceInCalendarDays, isSaturday, isSunday } from "date-fns";
import type { Budget, Category, SavingsGoal, Transaction } from "@/types/database";
import { computeGoalProjection, percentChange } from "@/lib/calculations/budget";

export type InsightImportance = "info" | "warning" | "positive";

export interface Insight {
  type: string;
  title: string;
  description: string;
  importance: InsightImportance;
  value?: number;
}

interface InsightInput {
  currentTransactions: Transaction[];
  previousTransactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  currentMonthProgress: number; // 0..1, how much of the current month has elapsed
}

function categoryName(categories: Category[], id: string | null): string {
  return categories.find((c) => c.id === id)?.name ?? "Autre";
}

function sumByCategory(transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = t.category_id ?? "uncategorized";
    map.set(key, (map.get(key) ?? 0) + t.amount_cents);
  }
  return map;
}

/** Deterministic, rule-based insights. No AI involved — see AGENTS.md. */
export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const { currentTransactions, previousTransactions, categories, budgets, goals } = input;

  const currentByCategory = sumByCategory(currentTransactions);
  const previousByCategory = sumByCategory(previousTransactions);

  // 1. Category spend increase / decrease vs previous period
  for (const [categoryId, currentCents] of currentByCategory) {
    const previousCents = previousByCategory.get(categoryId) ?? 0;
    const change = percentChange(currentCents, previousCents);
    if (change === null || previousCents < 2000) continue; // ignore noise on tiny categories
    const name = categoryName(categories, categoryId);
    if (change >= 0.25) {
      insights.push({
        type: "category_increase",
        title: `${name} en hausse`,
        description: `Tes dépenses ${name.toLowerCase()} ont augmenté de ${Math.round(change * 100)} % ce mois-ci.`,
        importance: "warning",
        value: change,
      });
    } else if (change <= -0.2) {
      insights.push({
        type: "category_decrease",
        title: `${name} en baisse`,
        description: `Tu as dépensé ${Math.round(Math.abs(change) * 100)} % de moins en ${name.toLowerCase()} que la période précédente.`,
        importance: "positive",
        value: change,
      });
    }
  }

  // 2. Budget close to / at risk of being exceeded
  for (const budget of budgets) {
    const spent = currentByCategory.get(budget.category_id) ?? 0;
    if (budget.amount_cents <= 0) continue;
    const ratio = spent / budget.amount_cents;
    const name = categoryName(categories, budget.category_id);
    if (ratio >= 1) {
      insights.push({
        type: "budget_exceeded",
        title: `Budget ${name} dépassé`,
        description: `Tu as dépassé ton budget ${name.toLowerCase()} de ${Math.round((ratio - 1) * 100)} %.`,
        importance: "warning",
        value: ratio,
      });
    } else if (ratio >= 0.8 && ratio > input.currentMonthProgress + 0.15) {
      insights.push({
        type: "budget_at_risk",
        title: `Budget ${name} presque atteint`,
        description: `Tu as déjà utilisé ${Math.round(ratio * 100)} % de ton budget ${name.toLowerCase()} alors que le mois est écoulé à ${Math.round(input.currentMonthProgress * 100)} %.`,
        importance: "warning",
        value: ratio,
      });
    }
  }

  // 3. Savings goal close to completion
  for (const goal of goals) {
    const projection = computeGoalProjection(
      goal.target_amount_cents,
      goal.current_amount_cents,
      goal.monthly_contribution_cents
    );
    if (!projection.isReached && projection.monthsToTarget !== null && projection.monthsToTarget <= 2) {
      insights.push({
        type: "goal_almost_reached",
        title: `Objectif "${goal.name}" bientôt atteint`,
        description: `À ton rythme actuel, tu atteindras ton objectif "${goal.name}" dans ${projection.monthsToTarget} mois.`,
        importance: "positive",
        value: projection.monthsToTarget,
      });
    }
  }

  // 4. Weekend spending concentration
  const weekendCents = currentTransactions
    .filter((t) => t.type === "expense")
    .filter((t) => {
      const d = new Date(t.transaction_date);
      return isSaturday(d) || isSunday(d);
    })
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const totalExpenseCents = currentTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  if (totalExpenseCents > 0) {
    const weekendRatio = weekendCents / totalExpenseCents;
    const weekendShareOfWeek = 2 / 7;
    if (weekendRatio - weekendShareOfWeek > 0.12) {
      const extraPct = Math.round(((weekendRatio - weekendShareOfWeek) / weekendShareOfWeek) * 100);
      insights.push({
        type: "weekend_spending",
        title: "Dépenses concentrées le week-end",
        description: `Tu dépenses en moyenne ${extraPct} % de plus le week-end que le reste de la semaine.`,
        importance: "info",
        value: weekendRatio,
      });
    }
  }

  // 5. Large one-off expense this period
  const expenseAmounts = currentTransactions.filter((t) => t.type === "expense").map((t) => t.amount_cents);
  if (expenseAmounts.length >= 4) {
    const avg = expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length;
    const max = Math.max(...expenseAmounts);
    if (max > avg * 4 && max > 5000) {
      const tx = currentTransactions.find((t) => t.amount_cents === max);
      insights.push({
        type: "large_expense",
        title: "Dépense exceptionnelle",
        description: `Une dépense de ${(max / 100).toFixed(2)} € (${tx?.merchant ?? tx?.description ?? "sans nom"}) sort nettement de tes habitudes.`,
        importance: "info",
        value: max,
      });
    }
  }

  return insights
    .sort((a, b) => (a.importance === "warning" ? -1 : b.importance === "warning" ? 1 : 0))
    .slice(0, 5);
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return differenceInCalendarDays(date, now);
}
