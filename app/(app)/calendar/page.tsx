import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTransactionsInRange } from "@/lib/data/transactions";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarGrid, type CalendarDayData } from "@/components/calendar/calendar-grid";
import { ExportCalendarButton } from "@/components/calendar/export-calendar-button";
import type { Account, Category, RecurringTransaction, Transaction } from "@/types/database";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const reference = params.month ? new Date(`${params.month}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const [accounts, categories, transactions, recurring] = await Promise.all([
    getAccounts(supabase, user.id),
    getCategories(supabase, user.id),
    getTransactionsInRange(supabase, user.id, iso(gridStart), iso(gridEnd)),
    getRecurringTransactions(supabase, user.id),
  ]);

  const accountById = new Map<string, Account>(accounts.map((a) => [a.id, a]));
  const categoryById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  function attachRelations<T extends { account_id: string; category_id: string | null }>(item: T) {
    return {
      ...item,
      account: accountById.get(item.account_id)!,
      category: item.category_id ? categoryById.get(item.category_id) ?? null : null,
    };
  }

  const days: CalendarDayData[] = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const dateStr = iso(date);
    return {
      date,
      transactions: (transactions as Transaction[])
        .filter((t) => t.transaction_date === dateStr)
        .map(attachRelations),
      recurring: (recurring as RecurringTransaction[])
        .filter((r) => r.active && r.next_occurrence === dateStr)
        .map(attachRelations),
    };
  });

  const prevHref = `/calendar?month=${format(addMonths(reference, -1), "yyyy-MM")}`;
  const nextHref = `/calendar?month=${format(addMonths(reference, 1), "yyyy-MM")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Calendrier financier"
        description="Anticipe tes dépenses et revenus à venir."
        action={<ExportCalendarButton defaultFrom={iso(monthStart)} defaultTo={iso(monthEnd)} />}
      />
      <CalendarGrid
        days={days}
        monthLabel={format(reference, "MMMM yyyy", { locale: fr })}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </div>
  );
}
