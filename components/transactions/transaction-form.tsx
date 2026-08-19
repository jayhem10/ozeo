"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { format } from "date-fns";
import type { z } from "zod";
import * as Icons from "lucide-react";
import { ChevronDown, Loader2, Star } from "lucide-react";
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

function resolveIcon(name: string): Icons.LucideIcon {
  const icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return icon ?? Icons.Tag;
}

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
  const [showDetails, setShowDetails] = useState(
    () => !!(defaultValues.merchant || defaultValues.description || defaultValues.goal_id)
  );
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
  const categoryId = watch("category_id");
  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "income" : c.type === "expense"
  );


  async function submit(values: TransactionFormValues) {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.success) setServerError(result.error ?? "Une erreur est survenue");
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
      <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-1">
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
                "h-11 rounded-lg border text-sm font-medium transition-colors",
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
            className="h-14 text-center text-2xl font-semibold"
            aria-invalid={!!errors.amount}
            {...register("amount")}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Catégorie</Label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-invalid={!!errors.category_id}>
            {filteredCategories.map((c) => {
              const isSelected = categoryId === c.id;
              const Icon = resolveIcon(c.icon);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setValue("category_id", c.id, { shouldValidate: true })}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
                    isSelected ? "border-transparent" : "border-input text-muted-foreground hover:bg-muted"
                  )}
                  style={isSelected ? { backgroundColor: `${c.color}1a`, color: c.color } : undefined}
                >
                  <Icon className="size-3.5" />
                  {c.is_favorite && <Star className="size-3 fill-amber-400 text-amber-400" />}
                  {c.name}
                </button>
              );
            })}
          </div>
          {errors.category_id && (
            <p className="text-xs text-destructive">{errors.category_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="space-y-1.5">
            <Label htmlFor="transaction_date">Date</Label>
            <Input id="transaction_date" type="date" className="h-8" {...register("transaction_date")} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform", showDetails && "rotate-180")} />
          Plus de détails
        </button>

        {showDetails && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="merchant">Marchand</Label>
              <Input id="merchant" placeholder="Carrefour, Netflix…" {...register("merchant")} />
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
                        "h-10 rounded-lg border text-xs font-medium transition-colors",
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
                        "h-10 rounded-lg border text-xs font-medium transition-colors",
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
          </div>
        )}

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-3 mt-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="sm:w-auto">
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full sm:h-8 sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
