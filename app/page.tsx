import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  PiggyBank,
  Target,
  BarChart3,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Ajout ultra-rapide",
    description: "Enregistre une dépense en quelques secondes, plus vite qu'en ouvrant ton appli bancaire.",
  },
  {
    icon: PiggyBank,
    title: "Budgets qui parlent",
    description: "Suis ton rythme de dépenses, pas seulement un total. Sais à l'avance si tu vas dépasser.",
  },
  {
    icon: Target,
    title: "Objectifs d'épargne",
    description: "Voyage, fonds d'urgence, achat futur : visualise ta progression mois après mois.",
  },
  {
    icon: BarChart3,
    title: "Analyses claires",
    description: "Où part ton argent, tes plus grosses dépenses, ton évolution sur 6 mois.",
  },
  {
    icon: RefreshCcw,
    title: "Dépenses récurrentes",
    description: "Abonnements et factures suivis automatiquement, sans mauvaise surprise.",
  },
  {
    icon: Sparkles,
    title: "Insights automatiques",
    description: "Des observations utiles générées par des règles simples, sans jargon inutile.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Ozeo</span>
        </div>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline" size="sm">
          Se connecter
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Comprends où va ton argent.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            L&apos;OS personnel de tes finances : dépenses, budgets, objectifs d&apos;épargne et insights
            automatiques, dans une interface rapide et agréable à utiliser au quotidien.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button render={<Link href="/login" />} nativeButton={false} size="lg" className="gap-2">
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            Connexion sécurisée avec Google — tes données sont isolées et protégées.
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Ozeo</p>
        <p className="mt-1 space-x-3">
          <Link href="/cgu" className="underline underline-offset-4">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/confidentialite" className="underline underline-offset-4">
            Politique de confidentialité
          </Link>
        </p>
      </footer>
    </div>
  );
}

