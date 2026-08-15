import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getTransactions } from "@/lib/data/transactions";
import { getSavingsGoals } from "@/lib/data/goals";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionsFilterBar } from "@/components/transactions/transactions-filter-bar";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 25;

export default async function TransactionsPage({
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

  const page = Number(params.page) || 1;
  const [accounts, categories, goals, { transactions, total }] = await Promise.all([
    getAccounts(supabase, user.id),
    getCategories(supabase, user.id),
    getSavingsGoals(supabase, user.id),
    getTransactions(supabase, user.id, {
      page,
      pageSize: PAGE_SIZE,
      search: typeof params.search === "string" ? params.search : undefined,
      categoryId: typeof params.categoryId === "string" ? params.categoryId : undefined,
      accountId: typeof params.accountId === "string" ? params.accountId : undefined,
      type:
        params.type === "expense" || params.type === "income" || params.type === "transfer"
          ? params.type
          : undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Transactions" description={`${total} transaction${total > 1 ? "s" : ""}`} />
      <TransactionsFilterBar accounts={accounts} categories={categories} />
      <TransactionsTable transactions={transactions} accounts={accounts} categories={categories} goals={goals} />
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
