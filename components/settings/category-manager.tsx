"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/shared/category-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/schemas";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import type { Category } from "@/types/database";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof categoryFormSchema>, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", icon: "Tag", color: "#6366f1", type: "expense" },
  });

  async function onSubmit(values: CategoryFormValues) {
    const result = await createCategory(values);
    if (result.success) {
      toast.success("Catégorie créée");
      reset();
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  const custom = categories.filter((c) => !c.is_default);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">Catégories</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
            <Plus className="size-4" />
            Nouvelle
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Nouvelle catégorie</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                      watch("type") === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {t === "expense" ? "Dépense" : "Revenu"}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" type="color" className="h-10 w-full p-1" {...register("color")} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories
          .filter((c) => c.is_default)
          .map((c) => (
            <CategoryBadge key={c.id} category={c} />
          ))}
      </div>

      {custom.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Personnalisées</p>
          {custom.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <CategoryBadge category={c} />
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </Button>
                }
                title="Supprimer cette catégorie ?"
                tooltip="Supprimer la catégorie"
                description="Les transactions existantes garderont leur historique mais perdront cette catégorie."
                confirmLabel="Supprimer"
                onConfirm={async () => {
                  const result = await deleteCategory(c.id);
                  if (result.success) toast.success("Catégorie supprimée");
                  else toast.error(result.error);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
