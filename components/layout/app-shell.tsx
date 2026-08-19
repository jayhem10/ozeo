"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountSwitcher } from "@/components/layout/account-switcher";
import { QuickAddTransaction } from "@/components/transactions/quick-add-transaction";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Account, Category, Profile, SavingsGoal } from "@/types/database";

export function AppShell({
  profile,
  accounts,
  categories,
  goals,
  selectedAccountId,
  children,
}: {
  profile: Profile | null;
  accounts: Account[];
  categories: Category[];
  goals: SavingsGoal[];
  selectedAccountId: string | null;
  children: React.ReactNode;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AppSidebar profile={profile} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:justify-end">
          <span className="text-sm font-semibold lg:hidden">Ozeo</span>
          <div className="flex items-center gap-2">
            <AccountSwitcher accounts={accounts} selectedAccountId={selectedAccountId} />
            <ThemeToggle />
            <Button onClick={() => setQuickAddOpen(true)} size="sm" className="hidden gap-1.5 sm:inline-flex">
              <Plus className="size-4" />
              Dépense
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <MobileNav onAddClick={() => setQuickAddOpen(true)} profile={profile} />
      <QuickAddTransaction
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        accounts={accounts}
        categories={categories}
        goals={goals}
      />
    </div>
  );
}
