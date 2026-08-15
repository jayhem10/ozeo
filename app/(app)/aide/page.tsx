import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Calendar,
  Target,
  Wallet,
  BarChart3,
  Upload,
  RefreshCcw,
  Settings,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Vue d'ensemble : solde total, dépenses/revenus du mois, taux d'épargne, avancement du budget du mois, évolution des 30 derniers jours, dépenses récentes, répartition par catégorie, dépenses à venir, objectifs d'épargne et insights automatiques.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transactions",
    description:
      "Toutes tes dépenses et revenus, avec recherche, filtres (type, catégorie, compte) et pagination. Tu peux modifier, dupliquer ou supprimer une transaction. Le bouton « Dépense » (ou le raccourci clavier n) ouvre l'ajout rapide et retient le dernier compte/catégorie utilisés.",
  },
  {
    icon: Wallet,
    title: "Comptes",
    description:
      "Représentent tes comptes bancaires ou espèces. Tu peux en créer, les renommer, les archiver. Le solde de chaque compte est recalculé automatiquement à chaque transaction — tu ne le modifies jamais à la main.",
  },
  {
    icon: PiggyBank,
    title: "Budgets",
    description:
      "Un budget mensuel par catégorie de dépense. Ozeo calcule ton rythme de dépense (normal, à surveiller, risque de dépassement, dépassé) et prévoit si tu vas tenir jusqu'à la fin du mois en fonction de ce que tu as déjà dépensé.",
  },
  {
    icon: RefreshCcw,
    title: "Dépenses récurrentes",
    description:
      "Abonnements, loyers, factures : déclare-les une fois avec leur fréquence, active ou désactive-les à volonté. Elles apparaissent dans le calendrier et dans le résumé mensuel sans que tu aies à les ressaisir.",
  },
  {
    icon: Target,
    title: "Objectifs d'épargne",
    description:
      "Fixe un montant cible (voyage, fonds d'urgence, achat...) et ajoute des contributions au fil du temps. Ozeo affiche ta progression et estime la date à laquelle tu atteindras l'objectif.",
  },
  {
    icon: Calendar,
    title: "Calendrier",
    description:
      "Vue mensuelle combinant tes transactions passées et les échéances de dépenses récurrentes à venir, pour anticiper les jours à forte sortie d'argent.",
  },
  {
    icon: BarChart3,
    title: "Analyses",
    description:
      "Revenus vs dépenses et taux d'épargne sur 6 mois, top marchands, comparaison avec le mois précédent — pour prendre du recul au-delà du mois en cours.",
  },
  {
    icon: Upload,
    title: "Import CSV",
    description:
      "Importe un relevé exporté depuis ta banque : associe les colonnes du fichier à celles d'Ozeo, l'outil détecte le format de date, prévisualise les lignes, repère les doublons et catégorise automatiquement selon des règles par marchand.",
  },
  {
    icon: Settings,
    title: "Paramètres",
    description:
      "Profil, devise, thème clair/sombre, gestion des catégories personnalisées, et suppression définitive du compte (zone de danger) si tu veux tout effacer.",
  },
];

export default function AidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Aide"
        description="Comment fonctionne Ozeo, section par section."
      />

      <Card>
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Ozeo est un outil de suivi de finances personnelles à saisie manuelle : pas de connexion bancaire
          automatique (Open Banking). Tu enregistres toi-même tes transactions (ou tu les importes en CSV), et
          Ozeo transforme ces données en budgets, objectifs, analyses et insights.
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </div>
                <CardTitle>{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{s.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Keyboard className="size-4" />
            </div>
            <CardTitle>Raccourcis et astuces</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">n</kbd> ouvre l&apos;ajout
            rapide de transaction depuis n&apos;importe quelle page.
          </p>
          <p>Les insights du dashboard sont générés par des règles déterministes (pas d&apos;IA) à partir de tes propres données.</p>
          <p>Les montants sont toujours stockés en centimes pour éviter les erreurs d&apos;arrondi.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <CardTitle>Confidentialité et sécurité</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Tes données sont isolées par utilisateur au niveau de la base de données (Row Level Security) : elles
            ne sont accessibles qu&apos;à toi. Supprimer ton compte depuis les paramètres efface définitivement
            toutes tes données.
          </p>
          <p>
            Plus de détails dans les{" "}
            <a className="underline underline-offset-4" href="/cgu">
              conditions d&apos;utilisation
            </a>{" "}
            et la{" "}
            <a className="underline underline-offset-4" href="/confidentialite">
              politique de confidentialité
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
