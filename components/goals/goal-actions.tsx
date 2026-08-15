"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { goalContributionSchema, type GoalContributionValues } from "@/lib/validations/schemas";
import { contributeToGoal, deleteGoal } from "@/lib/actions/goals";

export function GoalActions({ goalId, goalName }: { goalId: string; goalName: string }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<z.input<typeof goalContributionSchema>, unknown, GoalContributionValues>({
    resolver: zodResolver(goalContributionSchema),
  });

  async function onSubmit(values: GoalContributionValues) {
    const result = await contributeToGoal(goalId, values);
    if (result.success) {
      toast.success("Contribution ajoutée");
      reset();
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
          <PlusCircle className="size-4" />
          Contribuer
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Contribuer à &quot;{goalName}&quot;</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" type="number" step="0.01" autoFocus {...register("amount")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Input id="note" {...register("note")} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Ajouter
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label="Supprimer l'objectif">
            <Trash2 className="size-4" />
          </Button>
        }
        title="Supprimer cet objectif ?"
        tooltip="Supprimer l'objectif"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const result = await deleteGoal(goalId);
          if (result.success) toast.success("Objectif supprimé");
          else toast.error(result.error);
        }}
      />
    </div>
  );
}
