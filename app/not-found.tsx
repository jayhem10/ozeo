import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Compass className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">Page introuvable</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cette page n&apos;existe pas ou plus.</p>
      </div>
      <Button render={<Link href="/dashboard" />} nativeButton={false}>
        Retour au dashboard
      </Button>
    </div>
  );
}
