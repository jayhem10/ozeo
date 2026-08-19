"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-media-query";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { createTransaction } from "@/lib/actions/transactions";
import { LAST_USED_ACCOUNT_KEY } from "@/lib/preferences";
import type { Account, Category, SavingsGoal } from "@/types/database";
import type { TransactionFormValues } from "@/lib/validations/schemas";

export function QuickAddTransaction({
  open,
  onOpenChange,
  accounts,
  categories,
  goals = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  goals?: SavingsGoal[];
}) {
  const isMobile = useIsMobile();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
      if (e.key.toLowerCase() === "n" && !isTyping && !open) {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSubmit = useCallback(
    async (values: TransactionFormValues) => {
      const result = await createTransaction(values);
      if (result.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LAST_USED_ACCOUNT_KEY, values.account_id);
        }
        toast.success("Transaction ajoutée");
        onOpenChange(false);
      }
      return result;
    },
    [onOpenChange]
  );

  const lastAccount =
    typeof window !== "undefined" ? localStorage.getItem(LAST_USED_ACCOUNT_KEY) : null;

  const defaultValues = {
    category_id: "",
    account_id: accounts.find((a) => a.id === lastAccount)?.id ?? accounts[0]?.id ?? "",
  };

  const form = (
    <TransactionForm
      accounts={accounts}
      categories={categories}
      goals={goals}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onCancel={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Nouvelle transaction</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">{form}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
