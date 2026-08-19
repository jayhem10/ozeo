import Link from "next/link";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Flame, Plus, TrendingDown, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { capitalize, cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data/profile";
import { getAccounts, getTotalBalance } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getBudgets } from "@/lib/data/budgets";
import { getRecentTransactions, getTransactionsInRange } from "@/lib/data/transactions";
import { getSavingsGoals } from "@/lib/data/goals";
import { getRecurringOccurrencesThrough } from "@/lib/data/recurring";
import { getSelectedAccountId, resolveSelectedAccountId } from "@/lib/data/account-filter";
import {
  computeBudgetProgress,
  computePeriodTotals,
  getMonthRange,
  getPreviousMonthRange,
  percentChange,
} from "@/lib/calculations/budget";
import { computeLoggingStreak } from "@/lib/calculations/streak";
import { generateInsights } from "@/lib/insights/engine";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { InsightCard } from "@/components/shared/insight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionList } from "@/components/transactions/transaction-list";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { GoalCard } from "@/components/goals/goal-card";
import { SpendingByCategoryChart, type CategorySlice } from "@/components/charts/spending-by-category-chart";
import { SpendingTrendChart, type TrendPoint } from "@/components/charts/spending-trend-chart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const { start: monthStart, end: monthEnd } = getMonthRange(now);
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange(now);
  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const profile = await getOrCreateProfile(supabase, user.id, user.email);
  const accounts = await getAccounts(supabase, user.id);
  const selectedAccountId = resolveSelectedAccountId(
    await getSelectedAccountId(profile.default_account_id),
    accounts
  );

  const [categories, budgets, recent, currentMonthTx, previousMonthTx, goals, upcoming] = await Promise.all([
    getCategories(supabase, user.id),
    getBudgets(supabase, user.id),
    getRecentTransactions(supabase, user.id, 6, selectedAccountId ?? undefined),
    getTransactionsInRange(supabase, user.id, iso(monthStart), iso(monthEnd), selectedAccountId ?? undefined),
    getTransactionsInRange(supabase, user.id, iso(prevStart), iso(prevEnd), selectedAccountId ?? undefined),
    getSavingsGoals(supabase, user.id),
    getRecurringOccurrencesThrough(supabase, user.id, iso(monthEnd), selectedAccountId ?? undefined),
  ]);

  const currency = profile?.currency ?? "EUR";
  const balanceAccounts = selectedAccountId ? accounts.filter((a) => a.id === selectedAccountId) : accounts;
  const totalBalance = await getTotalBalance(balanceAccounts);
  const totals = computePeriodTotals(currentMonthTx);
  // Derived from data already loaded above — no extra query needed.
  const monthStartBalanceCents = totalBalance - totals.netCents;
  const monthProgress = Math.min(
    1,
    Math.max(0, (differenceInCalendarDays(now, monthStart) + 1) / (differenceInCalendarDays(monthEnd, monthStart) + 1))
  );

  const monthlyBudgetCents = profile?.monthly_budget_cents ?? 0;
  const budgetUsedRatio = monthlyBudgetCents > 0 ? totals.expenseCents / monthlyBudgetCents : 0;
  const remainingBudgetCents = monthlyBudgetCents - totals.expenseCents;

  const previousTotals = computePeriodTotals(previousMonthTx);
  const expenseChange = percentChange(totals.expenseCents, previousTotals.expenseCents);
  const incomeChange = percentChange(totals.incomeCents, previousTotals.incomeCents);
  const savingsChange = totals.savingsRate - previousTotals.savingsRate;

  // "Reste à vivre" only factors in recurring income/expenses still due this month —
  // it intentionally ignores one-off transactions the user hasn't logged yet.
  const upcomingIncomeCents = upcoming
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const upcomingExpenseCents = upcoming
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const hasRemainingRecurring = upcoming.length > 0;
  const resteAVivreCents = totalBalance + upcomingIncomeCents - upcomingExpenseCents;

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

  const last30Days = await getTransactionsInRange(
    supabase,
    user.id,
    iso(subDays(now, 29)),
    iso(now),
    selectedAccountId ?? undefined
  );
  const trendData: TrendPoint[] = Array.from({ length: 30 }).map((_, i) => {
    const day = subDays(now, 29 - i);
    const dayCents = last30Days
      .filter((t) => t.type === "expense" && t.transaction_date === iso(day))
      .reduce((sum, t) => sum + t.amount_cents, 0);
    return { date: format(day, "d MMM", { locale: fr }), cents: dayCents };
  });

  const { streak, loggedToday } = computeLoggingStreak(
    last30Days.map((t) => t.transaction_date),
    now
  );

  const budgetProgress = budgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.category_id);
      if (!category) return null;
      const spent = currentMonthTx
        .filter((t) => t.type === "expense" && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount_cents, 0);
      const progress = computeBudgetProgress(b, spent, monthStart, monthEnd, now);
      return { category, progress };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => b.progress.progressRatio - a.progress.progressRatio)
    .slice(0, 4);

  const insights = generateInsights({
    currentTransactions: currentMonthTx,
    previousTransactions: previousMonthTx,
    categories,
    budgets,
    goals,
    currentMonthProgress: monthProgress,
  });

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title={`Bonjour${firstName ? `, ${firstName}` : ""} 👋`}
        description={capitalize(format(now, "EEEE d MMMM yyyy", { locale: fr }))}
        action={
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm",
              streak > 0 ? "border-orange-500/30 bg-orange-500/5" : "bg-card"
            )}
          >
            <Flame className={cn("size-5", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
            <p className="text-sm">
              <span className="font-semibold">{streak}</span>{" "}
              <span className="text-muted-foreground">{streak > 1 ? "jours d'affilée" : "jour d'affilée"}</span>
            </p>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <Wallet className="size-4" />
            Solde{selectedAccountId && balanceAccounts[0] ? ` — ${balanceAccounts[0].name}` : ""}
          </div>
          <MoneyDisplay cents={totalBalance} currency={currency} size="xl" className="mt-2" />
          <p className="mt-3 text-sm text-muted-foreground">
            {!loggedToday
              ? streak > 0
                ? "Ajoute une transaction aujourd'hui pour garder ta série ! 🔥"
                : "Ajoute ta première transaction du jour pour démarrer une série."
              : selectedAccountId
                ? "Solde réel de ce compte, à jour."
                : "Solde réel de tous tes comptes, à jour."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Solde au {format(monthStart, "d MMM", { locale: fr })} :{" "}
            <MoneyDisplay
              cents={monthStartBalanceCents}
              currency={currency}
              size="sm"
              className={monthStartBalanceCents < 0 ? "text-red-600" : undefined}
            />
            {monthStartBalanceCents < 0 && " — tu as commencé le mois en découvert"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <Target className="size-4" />
            Reste à vivre (ce mois)
          </div>
          <MoneyDisplay
            cents={resteAVivreCents}
            currency={currency}
            size="xl"
            className={cn("mt-2", resteAVivreCents < 0 ? "text-red-600" : undefined)}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {hasRemainingRecurring
              ? "Solde + revenus récurrents restants − dépenses récurrentes restantes d'ici la fin du mois."
              : "Aucune récurrence en attente ce mois-ci : identique au solde pour l'instant."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Dépenses du mois"
          value={<MoneyDisplay cents={totals.expenseCents} currency={currency} size="lg" />}
          icon={TrendingDown}
          trend={
            expenseChange !== null
              ? {
                  label: `${expenseChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(expenseChange * 100))} % vs mois dernier`,
                  positive: expenseChange < 0,
                }
              : undefined
          }
        />
        <StatCard
          label="Revenus du mois"
          value={<MoneyDisplay cents={totals.incomeCents} currency={currency} size="lg" />}
          icon={TrendingUp}
          trend={
            incomeChange !== null
              ? {
                  label: `${incomeChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(incomeChange * 100))} % vs mois dernier`,
                  positive: incomeChange >= 0,
                }
              : undefined
          }
        />
        <StatCard
          label="Taux d'épargne"
          value={`${Math.round(totals.savingsRate * 100)} %`}
          icon={PiggyBank}
          trend={{
            label: `${savingsChange >= 0 ? "↑" : "↓"} ${Math.abs(Math.round(savingsChange * 100))} pts vs mois dernier`,
            positive: savingsChange >= 0,
          }}
        />
      </div>

      {monthlyBudgetCents > 0 && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Budget du mois</p>
              <p className="text-sm text-muted-foreground">
                <MoneyDisplay cents={totals.expenseCents} currency={currency} size="sm" /> dépensés sur{" "}
                <MoneyDisplay cents={monthlyBudgetCents} currency={currency} size="sm" />
              </p>
            </div>
            <p className={remainingBudgetCents < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
              {remainingBudgetCents >= 0 ? "Reste " : "Dépassé de "}
              <MoneyDisplay cents={Math.abs(remainingBudgetCents)} currency={currency} size="sm" />
            </p>
          </div>
          <Progress value={Math.min(100, budgetUsedRatio * 100)} className="mt-3 h-2" />
        </div>
      )}

      {hasRemainingRecurring && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="font-medium">Détail du reste à vivre</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Solde actuel <MoneyDisplay cents={totalBalance} currency={currency} size="sm" />
            {upcomingIncomeCents > 0 && (
              <>
                {" + "}
                <MoneyDisplay cents={upcomingIncomeCents} currency={currency} size="sm" /> à venir
              </>
            )}
            {upcomingExpenseCents > 0 && (
              <>
                {" − "}
                <MoneyDisplay cents={upcomingExpenseCents} currency={currency} size="sm" /> prévues
              </>
            )}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-2 font-medium">Évolution — 30 derniers jours</p>
            <SpendingTrendChart data={trendData} />
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">Dépenses récentes</p>
              <Link href="/transactions" className="text-sm text-primary hover:underline">
                Voir tout
              </Link>
            </div>
            <TransactionList
              transactions={recent}
              emptyAction={
                <Button render={<Link href="/transactions" />} nativeButton={false} size="sm">
                  <Plus className="mr-1.5 size-4" />
                  Ajouter une dépense
                </Button>
              }
            />
          </div>

          {budgetProgress.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">Budgets</p>
                <Link href="/budgets" className="text-sm text-primary hover:underline">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-4">
                {budgetProgress.map(({ category, progress }) => (
                  <BudgetProgress
                    key={category.id}
                    category={category}
                    spentCents={progress.spentCents}
                    budgetCents={progress.budgetCents}
                    progressRatio={progress.progressRatio}
                    pace={progress.pace}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {categorySlices.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-2 font-medium">Dépenses par catégorie</p>
              <SpendingByCategoryChart data={categorySlices} />
            </div>
          )}

          {insights.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-3 font-medium">Insights</p>
              <div className="space-y-2">
                {insights.map((insight) => (
                  <InsightCard key={insight.type + insight.title} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">À venir ce mois-ci</p>
                <Link href="/recurring" className="text-sm text-primary hover:underline">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <div key={`${r.id}-${r.occurrence_date}`} className="flex items-center justify-between text-sm">
                    <span className="truncate">{r.name}</span>
                    <MoneyDisplay cents={r.type === "expense" ? -r.amount_cents : r.amount_cents} signed size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">Objectifs</p>
              <Link href="/goals" className="text-sm text-primary hover:underline">
                Voir tout
              </Link>
            </div>
            {goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Pas encore d'objectif"
                description="Crée un objectif d'épargne pour suivre ta progression."
              />
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 2).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
