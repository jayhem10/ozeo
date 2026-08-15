import * as Icons from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import type { Account } from "@/types/database";

const TYPE_LABEL: Record<Account["type"], string> = {
  checking: "Compte courant",
  savings: "Épargne",
  cash: "Espèces",
  credit_card: "Carte de crédit",
  investment: "Investissement",
  other: "Autre",
};

function resolveIcon(name: string): Icons.LucideIcon {
  return (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Wallet;
}

export function AccountCard({ account, children }: { account: Account; children?: React.ReactNode }) {
  const Icon = resolveIcon(account.icon);

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `${account.color}1a`, color: account.color }}
          >
            <Icon className="size-4" />
          </div>
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="text-xs text-muted-foreground">{TYPE_LABEL[account.type]}</p>
          </div>
        </div>
        {children}
      </div>
      <MoneyDisplay cents={account.current_balance_cents} currency={account.currency} size="lg" />
    </div>
  );
}
