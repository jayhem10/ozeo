"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réessaie, ou reviens au tableau de bord si le problème persiste.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">
          Réessayer
        </Button>
        <Button render={<Link href="/dashboard" />} nativeButton={false}>
          Retour au dashboard
        </Button>
      </div>
    </div>
  );
}
