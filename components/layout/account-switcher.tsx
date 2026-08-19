"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setSelectedAccount } from "@/lib/actions/account-filter";
import type { Account } from "@/types/database";

const ALL_ACCOUNTS = "all";

export function AccountSwitcher({
  accounts,
  selectedAccountId,
}: {
  accounts: Account[];
  selectedAccountId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (accounts.length < 2) return null;

  const value = selectedAccountId ?? ALL_ACCOUNTS;

  function handleChange(next: string) {
    startTransition(async () => {
      await setSelectedAccount(next === ALL_ACCOUNTS ? null : next);
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={(v) => v && handleChange(v)}>
      <SelectTrigger className="w-44 gap-1.5" disabled={isPending}>
        <Wallet className="size-4 shrink-0 text-muted-foreground" />
        <SelectValue>
          {(v: string) => (v === ALL_ACCOUNTS ? "Tous les comptes" : accounts.find((a) => a.id === v)?.name)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_ACCOUNTS}>Tous les comptes</SelectItem>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
