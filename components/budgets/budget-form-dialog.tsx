"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/shared/category-badge";
import { budgetFormSchema, type BudgetFormValues } from "@/lib/validations/schemas";
import { upsertBudget } from "@/lib/actions/budgets";
import type { Budget, Category } from "@/types/database";

export function BudgetFormDialog({
  category,
  budget,
  trigger,
}: {
  category: Category;
  budget?: Budget;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof budgetFormSchema>, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category_id: category.id,
      amount: budget ? budget.amount_cents / 100 : undefined,
      period: "monthly",
      rollover: budget?.rollover ?? false,
    },
  });

  async function onSubmit(values: BudgetFormValues) {
    const result = await upsertBudget(values);
    if (result.success) {
      toast.success("Budget mis à jour");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Budget mensuel</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 pb-2">
          <CategoryBadge category={category} />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("category_id")} />
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant mensuel</Label>
            <Input id="amount" type="number" step="0.01" autoFocus {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
