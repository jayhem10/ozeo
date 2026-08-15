"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { Profile } from "@/types/database";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const { theme, setTheme } = useTheme();
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
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    const result = await updateProfile(values);
    if (result.success) toast.success("Profil mis à jour");
    else toast.error(result.error);
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
        <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
