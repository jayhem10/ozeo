"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useTheme } from "next-themes";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validations/schemas";
import { updateProfile } from "@/lib/actions/profile";
import type { Account, Profile } from "@/types/database";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];
const ALL_ACCOUNTS = "all";

export function ProfileForm({ profile, accounts }: { profile: Profile; accounts: Account[] }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof profileFormSchema>, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      currency: profile.currency,
      locale: profile.locale,
      timezone: profile.timezone,
      monthly_budget: profile.monthly_budget_cents ? profile.monthly_budget_cents / 100 : undefined,
      default_account_id: profile.default_account_id,
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    const result = await updateProfile(values);
    if (result.success) {
      toast.success("Profil mis à jour");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nom complet</Label>
        <Input id="full_name" {...register("full_name")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Devise</Label>
          <Select value={watch("currency")} onValueChange={(v) => v && setValue("currency", v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthly_budget">Budget mensuel</Label>
          <Input id="monthly_budget" type="number" step="0.01" {...register("monthly_budget")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Thème</Label>
        {/* Theme is only known to the browser (localStorage); keep "system" until mounted to avoid a hydration mismatch. */}
        <Select value={mounted ? theme : "system"} onValueChange={(v) => v && setTheme(v)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) => (v === "light" ? "Clair" : v === "dark" ? "Sombre" : "Système")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Clair</SelectItem>
            <SelectItem value="dark">Sombre</SelectItem>
            <SelectItem value="system">Système</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}

      {accounts.length > 1 && (
        <div className="space-y-1.5">
          <Label>Compte affiché par défaut</Label>
          <Select
            value={watch("default_account_id") ?? ALL_ACCOUNTS}
            onValueChange={(v) => v && setValue("default_account_id", v === ALL_ACCOUNTS ? null : v)}
          >
            <SelectTrigger className="w-full">
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
          <p className="text-xs text-muted-foreground">
            Vue affichée par défaut sur le dashboard, le calendrier, les analyses et les budgets.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
