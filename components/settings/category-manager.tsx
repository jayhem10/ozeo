"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Loader2, Plus, Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { CategoryBadge } from "@/components/shared/category-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validations/schemas";
import { createCategory, deleteCategory, setCategoryFavorite } from "@/lib/actions/categories";
import type { Category } from "@/types/database";

function FavoriteToggle({ category }: { category: Category }) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const result = await setCategoryFavorite(category.id, !category.is_favorite);
    setPending(false);
    if (!result.success) toast.error(result.error);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={toggle}
      aria-label={category.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star className={cn("size-4", category.is_favorite && "fill-amber-400 text-amber-400")} />
    </Button>
  );
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex items-center justify-between">
      <CategoryBadge category={category} />
      <div className="flex items-center">
        <FavoriteToggle category={category} />
        {!category.is_default && (
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
              const result = await deleteCategory(category.id);
              if (result.success) toast.success("Catégorie supprimée");
              else toast.error(result.error);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
  const expense = filtered.filter((c) => c.type === "expense");
  const income = filtered.filter((c) => c.type === "income");

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">Catégories</p>
        <ResponsiveDialog
          open={open}
          onOpenChange={setOpen}
          title="Nouvelle catégorie"
          contentClassName="sm:max-w-xs"
          trigger={{
            render: <Button size="sm" variant="outline" className="gap-1.5" />,
            children: (
              <>
                <Plus className="size-4" />
                Nouvelle
              </>
            ),
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1 py-1">
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
                    className={`h-11 rounded-lg border text-sm font-medium ${
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
            </div>
            <div className="flex justify-end gap-2 border-t pt-3 mt-3">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer
              </Button>
            </div>
          </form>
        </ResponsiveDialog>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une catégorie"
        />
      </div>

      {expense.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Dépenses</p>
          {expense.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      )}

      {income.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Revenus</p>
          {income.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      )}

      {expense.length === 0 && income.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune catégorie trouvée.</p>
      )}
    </div>
  );
}
