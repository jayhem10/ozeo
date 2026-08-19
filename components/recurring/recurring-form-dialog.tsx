"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { recurringFormSchema, type RecurringFormValues } from "@/lib/validations/schemas";
import { createRecurring, updateRecurring } from "@/lib/actions/recurring";
import type { Account, Category, RecurringTransaction } from "@/types/database";

const FREQUENCIES: { value: RecurringFormValues["frequency"]; label: string }[] = [
  { value: "weekly", label: "Chaque semaine" },
  { value: "monthly", label: "Chaque mois" },
  { value: "yearly", label: "Chaque année" },
  { value: "custom", label: "Personnalisé" },
];

export function RecurringFormDialog({
  accounts,
  categories,
  recurring,
}: {
  accounts: Account[];
  categories: Category[];
  recurring?: RecurringTransaction;
}) {
  const [open, setOpen] = useState(false);
  const emptyDefaults: RecurringFormValues = {
    name: "",
    account_id: accounts[0]?.id ?? "",
    category_id: null,
    amount: undefined as unknown as number,
    type: "expense",
    frequency: "monthly",
    next_occurrence: format(new Date(), "yyyy-MM-dd"),
    active: true,
  };
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof recurringFormSchema>, unknown, RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: recurring
      ? {
          name: recurring.name,
          account_id: recurring.account_id,
          category_id: recurring.category_id,
          amount: recurring.amount_cents / 100,
          type: recurring.type === "transfer" ? "expense" : recurring.type,
          frequency: recurring.frequency,
          next_occurrence: recurring.next_occurrence,
          active: recurring.active,
        }
      : emptyDefaults,
  });

  const type = watch("type");
  const filteredCategories = categories.filter((c) => c.type === type);

  async function onSubmit(values: RecurringFormValues) {
    const result = recurring
      ? await updateRecurring(recurring.id, values)
      : await createRecurring(values);
    if (result.success) {
      toast.success(recurring ? "Récurrence mise à jour" : "Récurrence créée");
      setOpen(false);
      if (!recurring) reset(emptyDefaults);
    } else {
      toast.error(result.error);
    }
  }

  function handleOpenChange(next: boolean) {
    if (next && !recurring) reset(emptyDefaults);
    setOpen(next);
  }

  return (
    <>
      {recurring && (
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setOpen(true)} />}
          >
            <Pencil className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Modifier</TooltipContent>
        </Tooltip>
      )}
      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={recurring ? "Modifier la récurrence" : "Nouvelle dépense récurrente"}
        trigger={
          recurring
            ? undefined
            : {
                render: <Button size="sm" className="gap-1.5" />,
                children: (
                  <>
                    <Plus className="size-4" />
                    Nouvelle récurrence
                  </>
                ),
              }
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="Netflix, Loyer…" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={`h-11 rounded-lg border text-sm font-medium ${
                    type === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t === "expense" ? "Dépense" : "Revenu"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select
                  value={watch("category_id") ?? ""}
                  onValueChange={(v) => setValue("category_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => filteredCategories.find((c) => c.id === v)?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Fréquence</Label>
                <Select
                  value={watch("frequency")}
                  onValueChange={(v) => setValue("frequency", v as RecurringFormValues["frequency"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => FREQUENCIES.find((f) => f.value === v)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next_occurrence">Prochaine échéance</Label>
                <Input id="next_occurrence" type="date" {...register("next_occurrence")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {recurring ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  );
}
