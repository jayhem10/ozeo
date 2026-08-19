"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, Plus } from "lucide-react";
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
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { accountFormSchema, type AccountFormValues } from "@/lib/validations/schemas";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import type { Account } from "@/types/database";

const ACCOUNT_TYPES: { value: Account["type"]; label: string }[] = [
  { value: "checking", label: "Compte courant" },
  { value: "savings", label: "Épargne" },
  { value: "cash", label: "Espèces" },
  { value: "credit_card", label: "Carte de crédit" },
  { value: "investment", label: "Investissement" },
  { value: "other", label: "Autre" },
];

export function AccountFormDialog({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof accountFormSchema>, unknown, AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          initial_balance: account.initial_balance_cents / 100,
          currency: account.currency,
          icon: account.icon,
          color: account.color,
        }
      : { name: "", type: "checking", initial_balance: 0, currency: "EUR", icon: "Wallet", color: "#6366f1" },
  });

  async function onSubmit(values: AccountFormValues) {
    const result = account ? await updateAccount(account.id, values) : await createAccount(values);
    if (result.success) {
      toast.success(account ? "Compte mis à jour" : "Compte créé");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={account ? "Modifier le compte" : "Nouveau compte"}
      trigger={
        account
          ? { render: <Button variant="ghost" size="sm" />, children: "Modifier" }
          : {
              render: <Button size="sm" className="gap-1.5" />,
              children: (
                <>
                  <Plus className="size-4" />
                  Nouveau compte
                </>
              ),
            }
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" placeholder="Compte courant" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={watch("type")} onValueChange={(v) => v && setValue("type", v as Account["type"])}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => ACCOUNT_TYPES.find((t) => t.value === v)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!account && (
            <div className="space-y-1.5">
              <Label htmlFor="initial_balance">Solde initial</Label>
              <Input id="initial_balance" type="number" step="0.01" {...register("initial_balance")} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-3 mt-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {account ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
