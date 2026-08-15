import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

const LAST_UPDATED = "15 août 2026";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_table]:mt-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:pb-2 [&_th]:text-left [&_th]:font-medium [&_td]:border-b [&_td]:py-2 [&_td]:align-top [&_td]:pr-4">
        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données à caractère personnel collectées via l&apos;application Ozeo
            est Jérémy Noble, entrepreneur individuel, établi au 3 allée de Charrière, 69570 Dardilly, France,
            joignable à l&apos;adresse{" "}
            <a className="underline underline-offset-4" href="mailto:contact@ozeo.app">contact@ozeo.app</a>.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>Dans le cadre de l&apos;utilisation d&apos;Ozeo, les données suivantes sont collectées :</p>
          <table>
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Exemples</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Données de compte</td>
                <td>Adresse e-mail, nom, photo de profil</td>
                <td>Fournies par Google ou Apple lors de la connexion (OAuth)</td>
              </tr>
              <tr>
                <td>Données financières déclaratives</td>
                <td>Transactions, comptes, budgets, objectifs d&apos;épargne, catégories, dépenses récurrentes</td>
                <td>Saisies manuellement ou importées via un fichier CSV par l&apos;Utilisateur</td>
              </tr>
              <tr>
                <td>Préférences</td>
                <td>Devise, thème (clair/sombre), catégories personnalisées</td>
                <td>Saisies par l&apos;Utilisateur</td>
              </tr>
              <tr>
                <td>Données techniques</td>
                <td>Adresse IP, identifiants de session, pages visitées, type d&apos;appareil</td>
                <td>Collectées automatiquement (cookies de session, Vercel Analytics)</td>
              </tr>
            </tbody>
          </table>
          <p>
            Ozeo ne demande jamais vos identifiants bancaires et n&apos;établit aucune connexion directe
            (Open Banking / DSP2) avec votre banque. Les seules données financières traitées sont celles que vous
            saisissez vous-même ou que vous importez volontairement via un fichier CSV.
          </p>
        </section>

        <section>
          <h2>3. Finalités et bases légales</h2>
          <table>
            <thead>
              <tr>
                <th>Finalité</th>
                <th>Base légale (RGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Création et gestion du compte, authentification</td>
                <td>Exécution du contrat (art. 6.1.b)</td>
              </tr>
              <tr>
                <td>Fourniture des fonctionnalités du Service (budgets, analyses, insights)</td>
                <td>Exécution du contrat (art. 6.1.b)</td>
              </tr>
              <tr>
                <td>Envoi d&apos;e-mails transactionnels (bienvenue, résumé hebdomadaire)</td>
                <td>Exécution du contrat / intérêt légitime (art. 6.1.b et 6.1.f)</td>
              </tr>
              <tr>
                <td>Mesure d&apos;audience (Vercel Analytics)</td>
                <td>Intérêt légitime à améliorer le Service (art. 6.1.f)</td>
              </tr>
              <tr>
                <td>Sécurité, prévention de la fraude</td>
                <td>Intérêt légitime (art. 6.1.f)</td>
              </tr>
              <tr>
                <td>Respect d&apos;obligations légales</td>
                <td>Obligation légale (art. 6.1.c)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>4. Destinataires et sous-traitants</h2>
          <p>
            Vos données ne sont jamais vendues. Elles sont accessibles uniquement à l&apos;Éditeur et aux
            sous-traitants suivants, dans la limite nécessaire à l&apos;exécution de leurs prestations :
          </p>
          <ul>
            <li><strong>Supabase Inc.</strong> — hébergement de la base de données (PostgreSQL) et authentification ;</li>
            <li><strong>Vercel Inc.</strong> — hébergement de l&apos;application et mesure d&apos;audience anonymisée ;</li>
            <li><strong>Google LLC / Apple Inc.</strong> — fournisseurs d&apos;authentification (connexion OAuth) ;</li>
            <li><strong>Brevo (Sendinblue SA)</strong> — envoi des e-mails transactionnels.</li>
          </ul>
          <p>
            Certains de ces prestataires peuvent être situés hors de l&apos;Union européenne. Le cas échéant, le
            transfert repose sur des garanties appropriées (clauses contractuelles types de la Commission
            européenne ou décision d&apos;adéquation).
          </p>
        </section>

        <section>
          <h2>5. Sécurité des données</h2>
          <p>
            L&apos;accès aux données est protégé par des mécanismes de sécurité au niveau base de données (Row
            Level Security de PostgreSQL/Supabase), garantissant que chaque Utilisateur ne peut accéder qu&apos;à
            ses propres données. L&apos;identité de l&apos;Utilisateur est systématiquement vérifiée côté serveur
            avant tout accès ou modification de données.
          </p>
        </section>

        <section>
          <h2>6. Durée de conservation</h2>
          <p>
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de votre compte
            (fonctionnalité disponible dans les paramètres du Service), l&apos;ensemble de vos données est effacé
            définitivement et sans délai des bases de production. Les données peuvent être conservées plus
            longtemps si une obligation légale l&apos;impose.
          </p>
        </section>

        <section>
          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit
            d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité
            sur vos données. Vous pouvez :
          </p>
          <ul>
            <li>modifier vos informations de profil directement dans les paramètres du Service ;</li>
            <li>supprimer vous-même l&apos;intégralité de votre compte et de vos données depuis les paramètres ;</li>
            <li>
              exercer tout autre droit en écrivant à{" "}
              <a className="underline underline-offset-4" href="mailto:contact@ozeo.app">contact@ozeo.app</a>.
            </li>
          </ul>
          <p>
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la Commission Nationale
            de l&apos;Informatique et des Libertés (CNIL) — <span>www.cnil.fr</span>.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            Ozeo utilise uniquement des cookies strictement nécessaires au fonctionnement du Service (maintien de
            la session d&apos;authentification via Supabase) ainsi qu&apos;un outil de mesure d&apos;audience
            (Vercel Analytics) fonctionnant sans cookie de suivi individuel. Aucun cookie publicitaire ou de
            traçage tiers n&apos;est utilisé.
          </p>
        </section>

        <section>
          <h2>9. Modification de la politique de confidentialité</h2>
          <p>
            Cette politique peut être mise à jour pour refléter les évolutions du Service ou de la réglementation.
            La version applicable est celle publiée sur cette page, avec sa date de dernière mise à jour.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link className="underline underline-offset-4" href="/">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
