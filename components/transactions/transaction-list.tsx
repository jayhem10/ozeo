import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Receipt } from "lucide-react";
import type { Account, Category, Transaction } from "@/types/database";

export function TransactionList({
  transactions,
  showAccount = false,
  emptyAction,
}: {
  transactions: (Transaction & { category: Category | null; account: Account })[];
  showAccount?: boolean;
  emptyAction?: React.ReactNode;
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Pas encore de dépenses"
        description="Ajoute ta première dépense pour commencer à suivre ton budget."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((t, i) => (
        <div key={t.id}>
          {i > 0 && <Separator className="opacity-0" />}
          <TransactionRow transaction={t} showAccount={showAccount} />
        </div>
      ))}
    </div>
  );
}
