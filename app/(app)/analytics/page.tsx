import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import { getTransactionsInRange } from "@/lib/data/transactions";
import { computePeriodTotals, percentChange } from "@/lib/calculations/budget";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { SpendingByCategoryChart, type CategorySlice } from "@/components/charts/spending-by-category-chart";
import { IncomeExpenseChart, type IncomeExpensePoint } from "@/components/charts/income-expense-chart";
import { SavingsRateChart, type SavingsRatePoint } from "@/components/charts/savings-rate-chart";
import { TrendingDown, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const months = Array.from({ length: 6 }).map((_, i) => subMonths(now, 5 - i));
  const monthlyTx = await Promise.all(
    months.map((m) => getTransactionsInRange(supabase, user.id, iso(startOfMonth(m)), iso(endOfMonth(m))))
  );

  const categories = await getCategories(supabase, user.id);

  const monthlyTotals = monthlyTx.map((tx) => computePeriodTotals(tx));
  const currentTotals = monthlyTotals[monthlyTotals.length - 1];
  const previousTotals = monthlyTotals[monthlyTotals.length - 2];

  const expenseChange = percentChange(currentTotals.expenseCents, previousTotals.expenseCents);
  const savingsChange = currentTotals.savingsRate - previousTotals.savingsRate;

  const incomeExpenseData: IncomeExpensePoint[] = months.map((m, i) => ({
    month: format(m, "MMM", { locale: fr }),
    incomeCents: monthlyTotals[i].incomeCents,
    expenseCents: monthlyTotals[i].expenseCents,
  }));

  const savingsRateData: SavingsRatePoint[] = months.map((m, i) => ({
    month: format(m, "MMM", { locale: fr }),
    ratio: monthlyTotals[i].savingsRate,
  }));

  const currentMonthTx = monthlyTx[monthlyTx.length - 1];
  const categorySlices: CategorySlice[] = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      color: c.color,
      cents: currentMonthTx
        .filter((t) => t.type === "expense" && t.category_id === c.id)
        .reduce((sum, t) => sum + t.amount_cents, 0),
    }))
    .filter((c) => c.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  const merchantTotals = new Map<string, number>();
  for (const t of currentMonthTx) {
    if (t.type !== "expense" || !t.merchant) continue;
    merchantTotals.set(t.merchant, (merchantTotals.get(t.merchant) ?? 0) + t.amount_cents);
  }
  const topMerchants = [...merchantTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Analyses" description={`Ton mois — ${format(now, "MMMM yyyy", { locale: fr })}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenus" value={<MoneyDisplay cents={currentTotals.incomeCents} size="lg" />} />
        <StatCard
          label="Dépenses"
          value={<MoneyDisplay cents={currentTotals.expenseCents} size="lg" />}
          icon={expenseChange !== null && expenseChange < 0 ? TrendingDown : TrendingUp}
          trend={
            expenseChange !== null
              ? {
                  label: `${expenseChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(expenseChange * 100))} % vs mois dernier`,
                  positive: expenseChange < 0,
                }
              : undefined
          }
        />
        <StatCard label="Épargne" value={<MoneyDisplay cents={currentTotals.netCents} signed size="lg" />} />
        <StatCard
          label="Taux d'épargne"
          value={`${Math.round(currentTotals.savingsRate * 100)} %`}
          trend={{
            label: `${savingsChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(savingsChange * 100))} pts vs mois dernier`,
            positive: savingsChange >= 0,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-2 font-medium">Revenus vs dépenses — 6 mois</p>
          <IncomeExpenseChart data={incomeExpenseData} />
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-2 font-medium">Taux d&apos;épargne — 6 mois</p>
          <SavingsRateChart data={savingsRateData} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categorySlices.length > 0 && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-2 font-medium">Où est parti ton argent ?</p>
            <SpendingByCategoryChart data={categorySlices} />
          </div>
        )}

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-3 font-medium">Top marchands</p>
          {topMerchants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pas encore assez de données.</p>
          ) : (
            <ol className="space-y-2">
              {topMerchants.map(([merchant, cents], i) => (
                <li key={merchant} className="flex items-center justify-between text-sm">
                  <span>
                    {i + 1}. {merchant}
                  </span>
                  <MoneyDisplay cents={cents} size="sm" />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
