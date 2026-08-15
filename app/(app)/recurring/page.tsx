import { RefreshCcw, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { RecurringTransactionCard } from "@/components/recurring/recurring-transaction-card";
import { RecurringFormDialog } from "@/components/recurring/recurring-form-dialog";
import { RecurringActions } from "@/components/recurring/recurring-actions";
import { RecurringFilterBar } from "@/components/recurring/recurring-filter-bar";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [accounts, categories, recurring] = await Promise.all([
    getAccounts(supabase, user.id),
    getCategories(supabase, user.id),
    getRecurringTransactions(supabase, user.id),
  ]);

  const activeMonthly = recurring.filter((r) => r.active && r.frequency === "monthly");
  const monthlyExpenseCents = activeMonthly
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const monthlyIncomeCents = activeMonthly
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const netCents = monthlyIncomeCents - monthlyExpenseCents;

  const search = typeof params.search === "string" ? params.search.toLowerCase() : "";
  const type = typeof params.type === "string" ? params.type : "all";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "all";
  const status = typeof params.status === "string" ? params.status : "all";
  const sort = typeof params.sort === "string" ? params.sort : "next_occurrence";

  const filtered = recurring.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (type !== "all" && r.type !== type) return false;
    if (categoryId !== "all" && r.category_id !== categoryId) return false;
    if (status === "active" && !r.active) return false;
    if (status === "inactive" && r.active) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "amount_desc":
        return b.amount_cents - a.amount_cents;
      case "amount_asc":
        return a.amount_cents - b.amount_cents;
      case "name_asc":
        return a.name.localeCompare(b.name);
      default:
        return a.next_occurrence.localeCompare(b.next_occurrence);
    }
  });

  const hasFilters = search || type !== "all" || categoryId !== "all" || status !== "all";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Dépenses récurrentes"
        description="Abonnements, loyer, salaires… prévois ton budget du mois à partir de ce qui revient chaque mois."
        action={<RecurringFormDialog accounts={accounts} categories={categories} />}
      />

      {recurring.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Revenus récurrents mensuels"
            icon={TrendingUp}
            value={<MoneyDisplay cents={monthlyIncomeCents} size="lg" />}
          />
          <StatCard
            label="Dépenses récurrentes mensuelles"
            icon={TrendingDown}
            value={<MoneyDisplay cents={monthlyExpenseCents} size="lg" />}
          />
          <StatCard
            label="Reste prévisionnel du mois"
            icon={Wallet}
            value={<MoneyDisplay cents={netCents} signed size="lg" />}
          />
        </div>
      )}

      {recurring.length === 0 ? (
        <EmptyState
          icon={RefreshCcw}
          title="Aucune dépense récurrente"
          description="Ajoute tes revenus et dépenses récurrents (salaire, loyer, abonnements…) pour prévoir ton budget du mois."
          action={<RecurringFormDialog accounts={accounts} categories={categories} />}
        />
      ) : (
        <>
          <RecurringFilterBar categories={categories} />
          {hasFilters && (
            <div className="flex justify-end">
              <Link
                href="/recurring"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Réinitialiser les filtres
              </Link>
            </div>
          )}
          {sorted.length === 0 ? (
            <EmptyState
              icon={RefreshCcw}
              title="Aucun résultat"
              description="Ajuste tes filtres pour voir tes dépenses récurrentes."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sorted.map((r) => (
                <RecurringTransactionCard key={r.id} recurring={r}>
                  <RecurringFormDialog accounts={accounts} categories={categories} recurring={r} />
                  <RecurringActions id={r.id} active={r.active} />
                </RecurringTransactionCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

