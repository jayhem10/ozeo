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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { goalFormSchema, type GoalFormValues } from "@/lib/validations/schemas";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import type { SavingsGoal } from "@/types/database";

export function GoalFormDialog({ goal }: { goal?: SavingsGoal }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof goalFormSchema>, unknown, GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal
      ? {
          name: goal.name,
          target_amount: goal.target_amount_cents / 100,
          current_amount: goal.current_amount_cents / 100,
          target_date: goal.target_date ?? "",
          icon: goal.icon,
          color: goal.color,
          monthly_contribution: goal.monthly_contribution_cents
            ? goal.monthly_contribution_cents / 100
            : undefined,
        }
      : {
          name: "",
          target_amount: undefined,
          current_amount: 0,
          target_date: "",
          icon: "Target",
          color: "#6366f1",
          monthly_contribution: undefined,
        },
  });

  async function onSubmit(values: GoalFormValues) {
    const result = goal ? await updateGoal(goal.id, values) : await createGoal(values);
    if (result.success) {
      toast.success(goal ? "Objectif mis à jour" : "Objectif créé");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {goal ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>Modifier</DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="size-4" />
          Nouvel objectif
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal ? "Modifier l'objectif" : "Nouvel objectif d'épargne"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" placeholder="Voyage au Japon" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target_amount">Objectif</Label>
              <Input id="target_amount" type="number" step="0.01" {...register("target_amount")} />
              {errors.target_amount && (
                <p className="text-xs text-destructive">{errors.target_amount.message}</p>
              )}
            </div>
            {!goal && (
              <div className="space-y-1.5">
                <Label htmlFor="current_amount">Déjà épargné</Label>
                <Input id="current_amount" type="number" step="0.01" {...register("current_amount")} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monthly_contribution">Contribution / mois</Label>
              <Input id="monthly_contribution" type="number" step="0.01" {...register("monthly_contribution")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Date cible</Label>
              <Input id="target_date" type="date" {...register("target_date")} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {goal ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
