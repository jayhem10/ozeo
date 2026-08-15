"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toggleRecurringActive, deleteRecurring } from "@/lib/actions/recurring";
import { Trash2 } from "lucide-react";

export function RecurringActions({ id, active }: { id: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        onCheckedChange={async (checked) => {
          const result = await toggleRecurringActive(id, checked);
          if (!result.success) toast.error(result.error);
        }}
        aria-label="Activer ou désactiver"
      />
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label="Supprimer">
            <Trash2 className="size-4" />
          </Button>
        }
        title="Supprimer cette récurrence ?"
        tooltip="Supprimer la récurrence"
        description="Les transactions déjà créées ne seront pas supprimées."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const result = await deleteRecurring(id);
          if (result.success) toast.success("Récurrence supprimée");
          else toast.error(result.error);
        }}
      />
    </div>
  );
}
