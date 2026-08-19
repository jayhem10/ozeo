"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useIsMobile } from "@/hooks/use-media-query";
import { updateTransaction, deleteTransaction, duplicateTransaction } from "@/lib/actions/transactions";
import { fromCents } from "@/lib/money";
import { Receipt, Target } from "lucide-react";
import type { Account, Category, GoalImpact, SavingsGoal, Transaction } from "@/types/database";

type TxWithRelations = Transaction & {
  category: Category | null;
  account: Account;
  goal?: SavingsGoal | null;
};

export function TransactionsTable({
  transactions,
  accounts,
  categories,
  goals = [],
}: {
  transactions: TxWithRelations[];
  accounts: Account[];
  categories: Category[];
  goals?: SavingsGoal[];
}) {
  const [editing, setEditing] = useState<TxWithRelations | null>(null);
  const isMobile = useIsMobile();

  if (transactions.length === 0) {
    return <EmptyState icon={Receipt} title="Aucune transaction" description="Ajuste tes filtres ou ajoute une dépense." />;
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateTransaction(id);
    if (result.success) toast.success("Transaction dupliquée");
    else toast.error(result.error);
  }

  async function handleDelete(id: string) {
    const result = await deleteTransaction(id);
    if (result.success) toast.success("Transaction supprimée");
    else toast.error(result.error);
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Marchand</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Compte</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(t.transaction_date), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="font-medium">{t.merchant || t.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={t.category} />
                    {t.goal && <GoalBadge goal={t.goal} impact={t.goal_impact} />}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.account.name}</TableCell>
                <TableCell className="text-right">
                  <MoneyDisplay cents={t.type === "expense" ? -t.amount_cents : t.amount_cents} signed />
                </TableCell>
                <TableCell>
                  <RowActions
                    transaction={t}
                    onEdit={() => setEditing(t)}
                    onDuplicate={() => handleDuplicate(t.id)}
                    onDelete={() => handleDelete(t.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile list */}
      <div className="space-y-2 md:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="space-y-2 rounded-xl border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium">
                {t.merchant || t.description || "Transaction"}
              </p>
              <MoneyDisplay
                cents={t.type === "expense" ? -t.amount_cents : t.amount_cents}
                signed
                size="sm"
                className="shrink-0"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <CategoryBadge category={t.category} />
                {t.goal && <GoalBadge goal={t.goal} impact={t.goal_impact} />}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(t.transaction_date), "d MMM", { locale: fr })}
                </span>
                <RowActions
                  transaction={t}
                  onEdit={() => setEditing(t)}
                  onDuplicate={() => handleDuplicate(t.id)}
                  onDelete={() => handleDelete(t.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing &&
        (() => {
          const form = (
            <TransactionForm
              accounts={accounts}
              categories={categories}
              goals={goals}
              submitLabel="Enregistrer"
              defaultValues={{
                type: editing.type === "transfer" ? "expense" : editing.type,
                amount: fromCents(editing.amount_cents),
                account_id: editing.account_id,
                category_id: editing.category_id ?? "",
                transaction_date: editing.transaction_date,
                merchant: editing.merchant ?? "",
                description: editing.description ?? "",
                notes: editing.notes ?? "",
                goal_id: editing.goal_id,
                goal_impact: editing.goal_impact,
              }}
              onSubmit={async (values) => {
                const result = await updateTransaction(editing.id, values);
                if (result.success) {
                  toast.success("Transaction mise à jour");
                  setEditing(null);
                }
                return result;
              }}
              onCancel={() => setEditing(null)}
            />
          );

          if (isMobile) {
            return (
              <Drawer open onOpenChange={(open) => !open && setEditing(null)}>
                <DrawerContent className="flex flex-col">
                  <DrawerHeader>
                    <DrawerTitle>Modifier la transaction</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">{form}</div>
                </DrawerContent>
              </Drawer>
            );
          }

          return (
            <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Modifier la transaction</DialogTitle>
                </DialogHeader>
                {form}
              </DialogContent>
            </Dialog>
          );
        })()}
    </>
  );
}

function GoalBadge({ goal, impact }: { goal: SavingsGoal; impact: GoalImpact | null }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${goal.color}1a`, color: goal.color }}
    >
      <Target className="size-3" />
      {goal.name} {impact === "withdrawal" ? "−" : "+"}
    </span>
  );
}

function RowActions({
  transaction,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  transaction: TxWithRelations;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Actions" />} />}
          >
            <MoreHorizontal className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 size-4" />
            Dupliquer
          </DropdownMenuItem>
          {/* Opens its own AlertDialog below, kept outside the menu so it isn't unmounted when the menu closes. */}
          <DropdownMenuItem onClick={() => setConfirmOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer cette transaction ?"
        description={`${transaction.merchant || transaction.description || "Cette transaction"} sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        onConfirm={onDelete}
      />
    </>
  );
}

