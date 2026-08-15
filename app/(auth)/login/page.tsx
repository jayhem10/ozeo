import Link from "next/link";
import { Sparkles } from "lucide-react";
import { OAuthSignInButton } from "@/components/auth/oauth-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-300 to-violet-500 text-white">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenue</h1>
          <p className="text-sm text-muted-foreground">
            Ton OS personnel des finances. Rapide, visuel, sans friction.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
          <OAuthSignInButton provider="google" next={next} />
          <OAuthSignInButton provider="apple" next={next} />
          {params.error && (
            <p className="text-center text-sm text-destructive">
              Une erreur est survenue pendant la connexion. Réessaie.
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            En continuant, tu acceptes nos{" "}
            <Link href="/cgu" className="underline underline-offset-4">
              conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="underline underline-offset-4">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
