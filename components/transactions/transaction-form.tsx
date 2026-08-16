"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { format } from "date-fns";
import type { z } from "zod";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validations/schemas";
import type { Account, Category, SavingsGoal } from "@/types/database";

const NO_CATEGORY = "__none__";

export function TransactionForm({
  accounts,
  categories,
  goals = [],
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Ajouter",
}: {
  accounts: Account[];
  categories: Category[];
  goals?: SavingsGoal[];
  defaultValues: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof transactionFormSchema>, unknown, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      account_id: accounts[0]?.id ?? "",
      category_id: "",
      amount: undefined,
      merchant: "",
      description: "",
      notes: "",
      goal_id: null,
      goal_impact: null,
      ...defaultValues,
    },
  });

  const type = watch("type");
  const goalId = watch("goal_id");
  const goalImpact = watch("goal_impact");
  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "income" : c.type === "expense"
  );


  async function submit(values: TransactionFormValues) {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.success) setServerError(result.error ?? "Une erreur est survenue");
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setValue("type", t);
              setValue("category_id", "");
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              type === t
                ? t === "expense"
                  ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t === "expense" ? "Dépense" : "Revenu"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          inputMode="decimal"
          autoFocus
          placeholder="0,00 €"
          {...register("amount")}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Catégorie</Label>
          <Select
            value={watch("category_id") || NO_CATEGORY}
            onValueChange={(v) => v && v !== NO_CATEGORY && setValue("category_id", v, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.category_id}>
              <SelectValue>
                {(v: string) => filteredCategories.find((c) => c.id === v)?.name ?? "Choisir une catégorie"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-1.5">
                    {c.is_favorite && <Star className="size-3 fill-amber-400 text-amber-400" />}
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-xs text-destructive">{errors.category_id.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Compte</Label>
          <Select value={watch("account_id")} onValueChange={(v) => v && setValue("account_id", v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => accounts.find((a) => a.id === v)?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account_id && (
            <p className="text-xs text-destructive">{errors.account_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="transaction_date">Date</Label>
          <Input id="transaction_date" type="date" {...register("transaction_date")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="merchant">Marchand</Label>
          <Input id="merchant" placeholder="Carrefour, Netflix…" {...register("merchant")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Note</Label>
        <Textarea id="description" rows={2} placeholder="Déjeuner avec Thomas" {...register("description")} />
      </div>

      {goals.length > 0 && (
        <div className="space-y-1.5">
          <Label>Objectif lié (optionnel)</Label>
          <Select
            value={goalId ?? "none"}
            onValueChange={(v) => {
              const nextGoalId = v === "none" ? null : v;
              setValue("goal_id", nextGoalId);
              setValue("goal_impact", nextGoalId ? goalImpact ?? "contribution" : null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => (v === "none" || !v ? "Aucun" : goals.find((g) => g.id === v)?.name)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {goalId && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setValue("goal_impact", "contribution")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  goalImpact === "contribution"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Alimenter l&apos;objectif (+)
              </button>
              <button
                type="button"
                onClick={() => setValue("goal_impact", "withdrawal")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  goalImpact === "withdrawal"
                    ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Utiliser l&apos;objectif (-)
              </button>
            </div>
          )}
          {errors.goal_impact && (
            <p className="text-xs text-destructive">{errors.goal_impact.message}</p>
          )}
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
