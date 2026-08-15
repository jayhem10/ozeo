import { Plus, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import { getBudgets } from "@/lib/data/budgets";
import { getTransactionsInRange } from "@/lib/data/transactions";
import { computeBudgetProgress, computeDailyAllowance, getMonthRange } from "@/lib/calculations/budget";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryBadge } from "@/components/shared/category-badge";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { Button } from "@/components/ui/button";

export default async function BudgetsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const { start, end } = getMonthRange(now);
  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const [categories, budgets, transactions] = await Promise.all([
    getCategories(supabase, user.id),
    getBudgets(supabase, user.id),
    getTransactionsInRange(supabase, user.id, iso(start), iso(end)),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const rows = expenseCategories.map((category) => {
    const budget = budgets.find((b) => b.category_id === category.id);
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category_id === category.id)
      .reduce((sum, t) => sum + t.amount_cents, 0);
    const progress = budget ? computeBudgetProgress(budget, spent, start, end, now) : null;
    return { category, budget, spent, progress };
  });

  const budgeted = rows.filter((r) => r.budget);
  const totalBudgetCents = budgeted.reduce((sum, r) => sum + (r.budget?.amount_cents ?? 0), 0);
  const totalSpentCents = budgeted.reduce((sum, r) => sum + r.spent, 0);
  const totalRemainingCents = totalBudgetCents - totalSpentCents;
  const dailyAllowance = computeDailyAllowance(totalRemainingCents, end, now);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Budgets" description="Suis ton rythme de dépenses par catégorie." />

      {budgeted.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Budget total" value={<MoneyDisplay cents={totalBudgetCents} size="lg" />} />
          <StatCard label="Dépensé" value={<MoneyDisplay cents={totalSpentCents} size="lg" />} />
          <StatCard
            label="Restant"
            value={<MoneyDisplay cents={totalRemainingCents} signed size="lg" />}
          />
          <StatCard
            label="Budget quotidien restant"
            value={<MoneyDisplay cents={dailyAllowance} size="lg" />}
          />
        </div>
      )}

      {expenseCategories.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Aucune catégorie"
          description="Crée des catégories de dépenses dans les paramètres pour définir des budgets."
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ category, budget, spent, progress }) => (
            <div key={category.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              {progress ? (
                <div className="space-y-3">
                  <BudgetProgress
                    category={category}
                    spentCents={progress.spentCents}
                    budgetCents={progress.budgetCents}
                    progressRatio={progress.progressRatio}
                    pace={progress.pace}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Estimation fin de mois : <MoneyDisplay cents={progress.forecastCents} size="sm" />
                    </span>
                    <BudgetFormDialog
                      category={category}
                      budget={budget}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <CategoryBadge category={category} />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      <MoneyDisplay cents={spent} size="sm" /> dépensés
                    </span>
                    <BudgetFormDialog
                      category={category}
                      trigger={
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Plus className="size-4" />
                          Définir un budget
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
