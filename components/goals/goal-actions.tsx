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
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
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
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`Contribuer à "${goalName}"`}
        contentClassName="sm:max-w-xs"
        trigger={{
          render: <Button variant="outline" size="sm" className="gap-1.5" />,
          children: (
            <>
              <PlusCircle className="size-4" />
              Contribuer
            </>
          ),
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" type="number" step="0.01" autoFocus {...register("amount")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Input id="note" {...register("note")} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-3 mt-3">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
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
