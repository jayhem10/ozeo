import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import type { Account, Category, RecurringTransaction } from "@/types/database";

const FREQUENCY_LABEL: Record<RecurringTransaction["frequency"], string> = {
  weekly: "/ semaine",
  monthly: "/ mois",
  yearly: "/ an",
  custom: "",
};

export function RecurringTransactionCard({
  recurring,
  children,
}: {
  recurring: RecurringTransaction & { category: Category | null; account: Account };
  children?: React.ReactNode;
}) {
  const signedCents = recurring.type === "expense" ? -recurring.amount_cents : recurring.amount_cents;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{recurring.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <CategoryBadge category={recurring.category} />
            <span className="text-xs text-muted-foreground">{recurring.account.name}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <MoneyDisplay cents={signedCents} signed className="font-semibold" />
          <p className="text-xs text-muted-foreground">{FREQUENCY_LABEL[recurring.frequency]}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <p className="truncate text-xs text-muted-foreground">
          Prochaine échéance : {format(new Date(recurring.next_occurrence), "d MMM yyyy", { locale: fr })}
        </p>
        <div className="flex shrink-0 items-center gap-1">{children}</div>
      </div>
    </div>
  );
}
