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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={setOpen}>
      {account ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>Modifier</DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="size-4" />
          Nouveau compte
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{account ? "Modifier le compte" : "Nouveau compte"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {account ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
