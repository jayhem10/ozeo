import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import type { Account, Category, Transaction } from "@/types/database";

export function TransactionRow({
  transaction,
  showAccount = false,
}: {
  transaction: Transaction & { category: Category | null; account: Account };
  showAccount?: boolean;
}) {
  const signedCents =
    transaction.type === "expense" ? -transaction.amount_cents : transaction.amount_cents;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <CategoryBadge category={transaction.category} className="shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {transaction.merchant || transaction.description || "Transaction"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {format(new Date(transaction.transaction_date), "d MMM yyyy", { locale: fr })}
            {showAccount && ` · ${transaction.account.name}`}
          </p>
        </div>
      </div>
      <MoneyDisplay cents={signedCents} signed size="sm" className="shrink-0 font-medium" />
    </div>
  );
}
