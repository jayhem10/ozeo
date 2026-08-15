"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteOwnAccount } from "@/lib/actions/profile";

export function DangerZone() {
  return (
    <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <div>
        <p className="font-medium text-destructive">Zone de danger</p>
        <p className="text-sm text-muted-foreground">
          Supprimer ton compte efface définitivement toutes tes données.
        </p>
      </div>
      <ConfirmDialog
        trigger={
          <Button variant="destructive" size="sm">
            Supprimer mon compte
          </Button>
        }
        title="Supprimer définitivement ton compte ?"
        description="Cette action est irréversible. Toutes tes transactions, budgets et objectifs seront supprimés."
        confirmLabel="Supprimer définitivement"
        onConfirm={async () => {
          const result = await deleteOwnAccount();
          if (result.success) {
            window.location.href = "/login";
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
