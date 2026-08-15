# Ozeo

Ton OS personnel des finances — rapide à utiliser au quotidien, visuel, avec assez de feedback pour donner envie d'y revenir.

Saisie manuelle → budgets → analyse → insights → objectifs. Pas d'Open Banking dans ce MVP, par design.

## Stack

- **Next.js 16** (App Router, TypeScript strict, Turbopack for dev)
- **Supabase** — PostgreSQL, Auth (Google OAuth), Row Level Security
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Recharts**, **React Hook Form** + **Zod**, **date-fns**, **Sonner**, **next-themes**, **papaparse**

## Fonctionnalités implémentées

- Authentification Google OAuth via Supabase (callback route, proxy/session refresh, routes protégées)
- Dashboard : solde, dépenses/revenus du mois, taux d'épargne, budget du mois, évolution 30 jours, dépenses récentes, dépenses par catégorie, dépenses à venir, objectifs, insights
- Ajout rapide de transaction (dialog desktop / drawer mobile, raccourci clavier `n`, mémorisation du dernier compte/catégorie utilisés)
- Transactions : recherche, filtres (type/catégorie/compte), pagination, modification, suppression, duplication
- Comptes : création, modification, archivage, solde recalculé automatiquement via trigger SQL
- Catégories : catégories système par défaut + catégories personnalisées
- Budgets mensuels par catégorie avec calcul de rythme (normal / à surveiller / risque de dépassement / dépassé) et prévision de fin de mois
- Dépenses récurrentes : création, activation/désactivation, suppression, synthèse mensuelle
- Objectifs d'épargne : progression, contributions, date d'atteinte estimée
- Calendrier financier mensuel (transactions passées + échéances récurrentes à venir)
- Analyses : revenus vs dépenses et taux d'épargne sur 6 mois, top marchands, comparaison au mois précédent
- Insights automatiques déterministes (pas d'IA) : hausse/baisse de catégorie, budget à risque, objectif bientôt atteint, dépenses concentrées le week-end, dépense exceptionnelle
- Import CSV : mapping de colonnes, détection de format de date, prévisualisation, détection des doublons, résumé d'import, catégorisation automatique par règles marchand
- Paramètres (profil, devise, thème), onboarding en 5 étapes, landing page publique
- Dark mode, responsive mobile-first, empty/error/loading states, PWA manifest de base

## Architecture

```
app/
  (auth)/login          — connexion Google
  (app)/…                — dashboard, transactions, budgets, calendar, recurring,
                            goals, accounts, analytics, import, settings (protégés par proxy.ts)
  onboarding/            — hors layout applicatif (évite la boucle de redirection)
  auth/callback/         — échange du code OAuth Supabase
components/
  ui/                    — shadcn/ui (Base UI)
  layout/ shared/ charts/ transactions/ budgets/ recurring/ goals/ accounts/
  calendar/ import/ settings/ auth/
lib/
  supabase/              — clients browser/server/admin
  actions/               — Server Actions (mutations, validation Zod, revalidatePath)
  data/                  — lectures Supabase côté serveur
  calculations/          — budgets, forecast, objectifs, comparaisons de périodes
  insights/              — moteur de règles déterministes
  validations/           — schémas Zod
  money.ts               — montants en centimes (jamais de float pour l'argent)
  categorization.ts      — règles marchand → catégorie
supabase/migrations/     — schéma, indexes, RLS, policies, triggers
scripts/seed.ts          — jeu de données de démo
```

## Sécurité

- RLS activé sur toutes les tables utilisateur, policies `auth.uid() = user_id` pour SELECT/INSERT/UPDATE/DELETE
- Le serveur récupère toujours l'utilisateur via `supabase.auth.getUser()` — jamais de `user_id` fourni par le client
- `proxy.ts` (remplace `middleware.ts` en Next 16) protège les routes privées et rafraîchit la session

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase
```

Dans Supabase : exécuter les migrations de `supabase/migrations/` (SQL editor ou `supabase db push`), activer le provider Google dans Authentication → Providers, ajouter l'URL de callback `<site>/auth/callback`.

```bash
npm run dev
```

Optionnel — jeu de données de démo (nécessite `SUPABASE_SERVICE_ROLE_KEY`) :

```bash
npm run seed
```

> Le seed crée un utilisateur par email/mot de passe côté admin API à des fins de données ; l'app elle-même n'utilise que Google OAuth. Pour visualiser les données du seed, générez un lien de connexion pour cet utilisateur depuis le dashboard Supabase, ou adaptez temporairement l'auth pour du dev local.

## Build & déploiement

```bash
npm run build
npm run type-check
npm run lint
```

> Si `next build` échoue localement avec une erreur Turbopack de type « binding to a port », relancez avec `next build --webpack` (n'arrive pas sur Vercel).

### Vercel

1. Importer le repo, définir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
2. Ajouter l'URL Vercel comme redirect URI OAuth dans Supabase et comme Site URL
3. Déployer

## Variables d'environnement

Voir [.env.example](.env.example).

## Points restant à configurer manuellement

- Créer le projet Supabase et exécuter les migrations SQL
- Activer et configurer le provider Google OAuth dans Supabase Auth
- Générer de vraies icônes PWA (le manifest utilise un SVG placeholder)
- Remplacer les domaines `ozeo.example.com` dans `app/robots.ts` / `app/sitemap.ts` par le domaine réel
- Brancher Sentry / Vercel Analytics / Resend si besoin (non inclus dans ce MVP)
