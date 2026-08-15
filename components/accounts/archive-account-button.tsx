"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveAccount } from "@/lib/actions/accounts";

export function ArchiveAccountButton({
  accountId,
  children,
}: {
  accountId: string;
  children: React.ReactNode;
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon" aria-label="Archiver le compte">
          {children}
        </Button>
      }
      title="Archiver ce compte ?"
      tooltip="Archiver le compte"
      description="Le compte ne sera plus visible mais son historique de transactions est conservé."
      confirmLabel="Archiver"
      onConfirm={async () => {
        const result = await archiveAccount(accountId);
        if (result.success) toast.success("Compte archivé");
        else toast.error(result.error);
      }}
    />
  );
}
