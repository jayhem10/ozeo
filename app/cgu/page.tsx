import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
};

const LAST_UPDATED = "15 août 2026";

export default function CguPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Conditions générales d&apos;utilisation</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        <section>
          <h2>Article 1 — Objet</h2>
          <p>
            Les présentes conditions générales d&apos;utilisation (les « CGU ») ont pour objet de définir les
            modalités et conditions dans lesquelles Ozeo (l&apos;« Éditeur ») met à disposition l&apos;application
            Ozeo (le « Service »), ainsi que les droits et obligations des utilisateurs (l&apos;« Utilisateur »,
            « vous ») dans ce cadre.
          </p>
          <p>
            Ozeo est un outil personnel de suivi de finances permettant la saisie manuelle de transactions, la
            création de budgets, le suivi d&apos;objectifs d&apos;épargne, la gestion de dépenses récurrentes,
            l&apos;import de relevés au format CSV et la consultation d&apos;analyses et d&apos;indicateurs
            générés automatiquement à partir de règles déterministes (sans intelligence artificielle et sans
            connexion directe à vos comptes bancaires — Ozeo ne propose pas d&apos;agrégation bancaire /
            Open Banking).
          </p>
          <p>
            L&apos;accès et l&apos;utilisation du Service impliquent l&apos;acceptation sans réserve des présentes
            CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
          </p>
        </section>

        <section>
          <h2>Article 2 — Éditeur du Service</h2>
          <p>
            Le Service est édité par : Jérémy Noble, entrepreneur individuel, dont l&apos;établissement est
            situé au 3 allée de Charrière, 69570 Dardilly, France.
          </p>
          <p>
            Contact : <a className="underline underline-offset-4" href="mailto:contact@ozeo.app">contact@ozeo.app</a>
          </p>
          <p>
            L&apos;hébergement de l&apos;application est assuré par Vercel Inc. et la base de données ainsi que
            l&apos;authentification par Supabase Inc. Les envois d&apos;e-mails transactionnels sont assurés par
            Brevo (Sendinblue SA).
          </p>
        </section>

        <section>
          <h2>Article 3 — Accès au Service et création de compte</h2>
          <p>
            Le Service est accessible gratuitement à toute personne disposant d&apos;un accès à Internet. Certaines
            fonctionnalités nécessitent la création d&apos;un compte via une connexion tierce (Google ou Apple).
            L&apos;Utilisateur est seul responsable de la confidentialité des identifiants de connexion associés à
            son compte et de toute activité réalisée depuis celui-ci.
          </p>
          <p>
            L&apos;Utilisateur doit être âgé d&apos;au moins 15 ans (ou disposer de l&apos;autorisation de son
            représentant légal si la loi applicable l&apos;exige) et fournir des informations exactes lors de son
            inscription.
          </p>
          <p>
            L&apos;Éditeur se réserve le droit de refuser, suspendre ou supprimer l&apos;accès d&apos;un
            Utilisateur en cas de manquement aux présentes CGU, d&apos;usage frauduleux ou abusif du Service.
          </p>
        </section>

        <section>
          <h2>Article 4 — Description des fonctionnalités</h2>
          <p>Le Service permet notamment :</p>
          <ul>
            <li>la saisie manuelle de transactions (dépenses, revenus) réparties par comptes et catégories ;</li>
            <li>la création de budgets mensuels par catégorie avec suivi de rythme de dépense ;</li>
            <li>le suivi d&apos;objectifs d&apos;épargne et de leurs contributions ;</li>
            <li>la gestion de dépenses récurrentes et d&apos;un calendrier financier ;</li>
            <li>
              l&apos;import de fichiers CSV (relevés bancaires exportés par l&apos;Utilisateur lui-même) avec
              détection de doublons et catégorisation automatique par règles ;
            </li>
            <li>
              l&apos;affichage d&apos;analyses et d&apos;« insights » générés par des règles de calcul déterministes
              appliquées aux données saisies par l&apos;Utilisateur.
            </li>
          </ul>
          <p>
            Les données financières affichées par le Service reposent exclusivement sur les informations saisies
            ou importées par l&apos;Utilisateur. Ozeo n&apos;a accès à aucun compte bancaire réel et ne réalise
            aucune opération bancaire, de paiement ou de conseil en investissement.
          </p>
        </section>

        <section>
          <h2>Article 5 — Absence de conseil financier</h2>
          <p>
            Les budgets, prévisions, indicateurs et « insights » fournis par le Service sont générés
            automatiquement à titre purement informatif et indicatif, sur la base des données renseignées par
            l&apos;Utilisateur. Ils ne constituent en aucun cas un conseil financier, comptable, fiscal ou
            juridique. L&apos;Utilisateur reste seul responsable de ses décisions financières.
          </p>
        </section>

        <section>
          <h2>Article 6 — Obligations de l&apos;Utilisateur</h2>
          <p>L&apos;Utilisateur s&apos;engage à :</p>
          <ul>
            <li>utiliser le Service conformément à sa destination et aux lois en vigueur ;</li>
            <li>ne pas tenter de contourner les mesures de sécurité du Service ;</li>
            <li>
              n&apos;importer ou saisir que des données dont il a le droit de disposer (ses propres données
              financières) ;
            </li>
            <li>ne pas utiliser le Service à des fins frauduleuses, notamment de blanchiment ou d&apos;évasion fiscale ;</li>
            <li>ne pas tenter d&apos;extraire, revendre ou exploiter commercialement le Service ou son contenu.</li>
          </ul>
        </section>

        <section>
          <h2>Article 7 — Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments du Service (marque « Ozeo », logo, charte graphique, interface,
            arborescence, textes, icônes, code source) sont protégés par le droit de la propriété intellectuelle
            et demeurent la propriété exclusive de l&apos;Éditeur. Toute reproduction, représentation,
            modification ou exploitation non autorisée, totale ou partielle, est interdite.
          </p>
          <p>
            Les données que l&apos;Utilisateur saisit ou importe dans le Service (transactions, budgets,
            objectifs, fichiers importés) restent sa propriété. L&apos;Utilisateur peut demander leur suppression
            à tout moment (voir Article 10).
          </p>
        </section>

        <section>
          <h2>Article 8 — Données personnelles</h2>
          <p>
            Le traitement des données à caractère personnel réalisé dans le cadre du Service est décrit dans la{" "}
            <Link className="underline underline-offset-4" href="/confidentialite">
              politique de confidentialité
            </Link>
            , qui fait partie intégrante des présentes CGU. Ce traitement est réalisé conformément au Règlement
            (UE) 2016/679 (« RGPD ») et à la loi n° 78-17 du 6 janvier 1978 modifiée relative à
            l&apos;informatique, aux fichiers et aux libertés.
          </p>
        </section>

        <section>
          <h2>Article 9 — Disponibilité et évolution du Service</h2>
          <p>
            L&apos;Éditeur s&apos;efforce d&apos;assurer un accès au Service 24h/24 et 7j/7, sans obligation de
            résultat. L&apos;accès peut être interrompu, notamment pour des opérations de maintenance, de mise à
            jour, ou en cas de force majeure, de panne ou de défaillance des prestataires techniques
            (hébergement, base de données, fournisseurs d&apos;identité tiers).
          </p>
          <p>
            L&apos;Éditeur se réserve le droit de faire évoluer, modifier, suspendre ou interrompre tout ou partie
            du Service, à tout moment, y compris d&apos;introduire à l&apos;avenir des fonctionnalités payantes,
            moyennant information préalable des Utilisateurs concernés.
          </p>
        </section>

        <section>
          <h2>Article 10 — Durée, résiliation et suppression du compte</h2>
          <p>
            Les présentes CGU s&apos;appliquent pendant toute la durée d&apos;utilisation du Service.
            L&apos;Utilisateur peut supprimer son compte à tout moment depuis la page Paramètres du Service ; cette
            action entraîne la suppression définitive et irréversible de l&apos;ensemble de ses données
            (comptes, transactions, budgets, objectifs, dépenses récurrentes).
          </p>
          <p>
            L&apos;Éditeur peut suspendre ou résilier l&apos;accès d&apos;un Utilisateur en cas de violation des
            présentes CGU, après mise en demeure restée sans effet lorsque cela est possible, sauf urgence ou
            manquement grave.
          </p>
        </section>

        <section>
          <h2>Article 11 — Responsabilité</h2>
          <p>
            Le Service est fourni « en l&apos;état ». L&apos;Éditeur ne garantit pas que le Service sera exempt
            d&apos;erreurs ou d&apos;interruptions. Dans la mesure permise par la loi applicable, l&apos;Éditeur
            ne saurait être tenu responsable des dommages indirects résultant de l&apos;utilisation ou de
            l&apos;impossibilité d&apos;utiliser le Service, ni des conséquences d&apos;une erreur ou omission dans
            les données saisies par l&apos;Utilisateur lui-même.
          </p>
          <p>
            L&apos;Utilisateur est seul responsable de l&apos;exactitude des données qu&apos;il saisit ou importe,
            ainsi que des décisions financières prises sur la base des informations affichées par le Service.
          </p>
        </section>

        <section>
          <h2>Article 12 — Modification des CGU</h2>
          <p>
            L&apos;Éditeur peut modifier les présentes CGU à tout moment, notamment pour les adapter aux
            évolutions du Service ou de la réglementation. La version applicable est celle en vigueur à la date
            de connexion de l&apos;Utilisateur, disponible sur cette page. En cas de modification substantielle,
            les Utilisateurs seront informés par tout moyen approprié (notification dans le Service ou par
            e-mail).
          </p>
        </section>

        <section>
          <h2>Article 13 — Droit applicable et litiges</h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige et à défaut de résolution
            amiable, compétence est attribuée aux tribunaux français compétents, sous réserve des dispositions
            impératives applicables aux consommateurs prévoyant une compétence différente.
          </p>
        </section>

        <section>
          <h2>Article 14 — Contact</h2>
          <p>
            Pour toute question relative aux présentes CGU, vous pouvez contacter l&apos;Éditeur à l&apos;adresse{" "}
            <a className="underline underline-offset-4" href="mailto:contact@ozeo.app">contact@ozeo.app</a>.
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
