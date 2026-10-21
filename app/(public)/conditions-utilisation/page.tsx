// app/(public)/conditions-utilisation/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Règles d'utilisation du site UNITECH, de l'assistant HARVEY, des comptes clients et de l'espace d'administration.",
};

export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      updated="21 octobre 2026"
      current="/conditions-utilisation"
      intro={
        <p>
          Ces conditions s&apos;appliquent à toute utilisation du site UNITECH : visite, assistant HARVEY, compte
          client et espace d&apos;administration. En utilisant le site, vous les acceptez.
        </p>
      }
    >
      <section>
        <h2>1. Éditeur</h2>
        <p>
          Le site est édité par UNITECH (Mali), représentée par son fondateur Laye Soma. Contact :{' '}
          <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a>, {LEGAL_CONTACT.phone}.
        </p>
      </section>

      <section>
        <h2>2. Pour tous les visiteurs</h2>
        <ul>
          <li>Le site présente les services, solutions, projets et formations d&apos;UNITECH.</li>
          <li>
            Les prix et informations affichés sont donnés à titre indicatif ; seuls un devis accepté ou une
            confirmation écrite d&apos;UNITECH engagent les deux parties.
          </li>
          <li>
            Il est interdit de perturber le site (envois automatisés massifs, tentative d&apos;intrusion,
            contournement des protections) ou de l&apos;utiliser à des fins illicites.
          </li>
          <li>Les informations transmises par les formulaires doivent être exactes.</li>
        </ul>
      </section>

      <section>
        <h2>3. L&apos;assistant HARVEY</h2>
        <ul>
          <li>
            HARVEY est une intelligence artificielle. Ses réponses peuvent contenir des erreurs : faites
            confirmer par l&apos;équipe toute information importante (prix, dates, conditions).
          </li>
          <li>Il ne remplace ni un devis, ni un contrat, ni un conseil juridique, médical ou financier.</li>
          <li>
            N&apos;y saisissez pas d&apos;informations sensibles. Le nombre de messages est limité pour garantir
            le service à tous.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Comptes clients</h2>
        <ul>
          <li>Vous fournissez des informations exactes et les tenez à jour.</li>
          <li>
            Votre mot de passe est personnel et confidentiel. Toute action faite depuis votre compte est réputée
            faite par vous ; signalez sans délai tout accès suspect. En cas d&apos;oubli, utilisez « Mot de passe
            oublié » sur la page de connexion.
          </li>
          <li>
            Les conditions propres à chaque service (prix, durée, périmètre) sont celles indiquées lors de la
            souscription ou dans le devis accepté ; elles priment sur les présentes en cas de différence.
          </li>
          <li>
            Automatisation des e-mails : vous garantissez être autorisé à connecter la messagerie concernée.
            Les réponses proposées par l&apos;IA doivent être relues ; vous restez responsable des messages
            envoyés en votre nom.
          </li>
          <li>
            UNITECH peut suspendre un compte en cas d&apos;utilisation frauduleuse, de défaut de paiement ou
            de manquement grave à ces conditions, après vous en avoir informé sauf urgence.
          </li>
          <li>Vous pouvez demander la fermeture de votre compte à tout moment par e-mail.</li>
        </ul>
      </section>

      <section>
        <h2>5. Formations</h2>
        <ul>
          <li>L&apos;inscription en ligne est une demande ; elle est confirmée par l&apos;équipe UNITECH.</li>
          <li>Les tarifs, horaires et modalités de paiement sont ceux communiqués lors de la confirmation.</li>
        </ul>
      </section>

      <section>
        <h2>6. Espace d&apos;administration</h2>
        <ul>
          <li>Il est réservé au personnel autorisé par UNITECH, avec les droits attribués à son rôle.</li>
          <li>
            Les identifiants sont strictement personnels : pas de partage de compte, déconnexion sur les
            appareils partagés.
          </li>
          <li>
            Les données des visiteurs et des clients sont consultées uniquement pour les besoins du service, ne
            sont ni copiées ni exportées sans nécessité, et restent confidentielles, y compris après la fin de la
            mission.
          </li>
          <li>Les actions sensibles sont journalisées.</li>
          <li>Tout incident de sécurité ou accès anormal doit être signalé immédiatement.</li>
        </ul>
      </section>

      <section>
        <h2>7. Propriété intellectuelle</h2>
        <p>
          Les contenus du site (textes, logos, visuels, logiciels) appartiennent à UNITECH ou à ses partenaires.
          Toute reproduction sans autorisation écrite est interdite, sauf usage personnel et non commercial.
        </p>
      </section>

      <section>
        <h2>8. Responsabilité et disponibilité</h2>
        <p>
          UNITECH fait ses meilleurs efforts pour que le site soit disponible et exact, sans pouvoir le garantir
          en permanence (maintenance, panne d&apos;un prestataire). Sa responsabilité ne peut être engagée pour un
          dommage indirect, ni pour l&apos;usage fait d&apos;une réponse de l&apos;assistant HARVEY sans
          confirmation de l&apos;équipe.
        </p>
      </section>

      <section>
        <h2>9. Données personnelles</h2>
        <p>
          Leur traitement est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link> et la{' '}
          <Link href="/cookies">politique de cookies</Link>.
        </p>
      </section>

      <section>
        <h2>10. Modifications et droit applicable</h2>
        <p>
          Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page. Elles sont soumises au
          droit malien. En cas de litige, une solution amiable est recherchée en priorité, à défaut les
          juridictions compétentes du Mali sont saisies.
        </p>
      </section>
    </LegalPage>
  );
}
