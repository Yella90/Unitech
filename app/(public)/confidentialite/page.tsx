// app/(public)/confidentialite/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT } from '@/components/public/LegalPage';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Quelles données UNITECH collecte, pourquoi, combien de temps, et comment exercer vos droits.',
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updated="21 octobre 2026"
      current="/confidentialite"
      intro={
        <p>
          Cette politique explique quelles données personnelles UNITECH traite lorsque vous visitez le site,
          échangez avec l&apos;assistant HARVEY, utilisez un compte client ou travaillez dans l&apos;espace
          d&apos;administration, et comment exercer vos droits.
        </p>
      }
    >
      <section>
        <h2>1. Qui est responsable de vos données</h2>
        <p>
          UNITECH (Mali), représentée par son fondateur Laye Soma, est responsable des traitements décrits ici.
          Pour toute question ou demande : <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a>,{' '}
          {LEGAL_CONTACT.phone}.
        </p>
      </section>

      <section>
        <h2>2. Visiteurs du site</h2>
        <h3>Mesure d&apos;audience (uniquement si vous l&apos;acceptez)</h3>
        <ul>
          <li>Page consultée, page de provenance, durée de la visite.</li>
          <li>Type d&apos;appareil, navigateur et système, déduits de votre navigateur.</li>
          <li>Un identifiant aléatoire de visiteur conservé dans votre navigateur.</li>
        </ul>
        <p>
          Ces statistiques servent à améliorer le site. Elles ne sont ni vendues, ni utilisées pour de la
          publicité. Vous pouvez changer d&apos;avis à tout moment via « Gérer les cookies » en bas de page.
        </p>

        <h3>Assistant HARVEY (chatbot)</h3>
        <ul>
          <li>
            La conversation est gardée dans votre navigateur pour que vous la retrouviez ; le bouton corbeille
            l&apos;efface.
          </li>
          <li>
            Vos messages sont transmis à notre serveur puis à un fournisseur d&apos;intelligence artificielle pour
            générer la réponse (voir section 5).
          </li>
          <li>
            Si vous donnez votre nom, votre e-mail ou votre téléphone, ou si vous montrez un intérêt pour une
            offre, nous enregistrons une fiche de contact (coordonnées données, besoin, budget éventuel et
            résumé de la conversation) pour vous recontacter.
          </li>
          <li>
            Si vous demandez le catalogue des formations, votre adresse e-mail sert à vous l&apos;envoyer.
          </li>
        </ul>
        <p>N&apos;indiquez pas d&apos;informations sensibles (santé, données bancaires, mots de passe) dans le chat.</p>

        <h3>Formulaires</h3>
        <ul>
          <li>Contact : nom, e-mail, objet et message.</li>
          <li>Demande de service : nom, e-mail, téléphone, entreprise, description du besoin, budget et délai.</li>
          <li>Inscription à une formation : nom, e-mail, téléphone, profession, entreprise, niveau et motivation.</li>
          <li>Newsletter : adresse e-mail.</li>
        </ul>
        <p>Ces données servent uniquement à répondre à votre demande et à en assurer le suivi.</p>
      </section>

      <section>
        <h2>3. Clients</h2>
        <ul>
          <li>
            Compte : prénom, nom, e-mail, téléphone, entreprise, adresse, ville et pays. Le mot de passe est
            stocké sous forme d&apos;empreinte (bcrypt) : personne, même chez UNITECH, ne peut le lire.
          </li>
          <li>Abonnements, demandes de services et historique d&apos;utilisation de vos services.</li>
          <li>
            Service d&apos;automatisation des e-mails : adresse et serveurs de votre messagerie, et mot de passe
            d&apos;application, chiffré (AES-256) et jamais renvoyé à votre navigateur. Les e-mails reçus sont
            récupérés, analysés et une réponse peut être proposée par l&apos;IA ; leur contenu est donc transmis
            à un fournisseur d&apos;IA. Vous restez responsable des réponses envoyées en votre nom.
          </li>
          <li>Sessions de connexion : adresse IP, navigateur et date de dernière activité, pour la sécurité.</li>
        </ul>
      </section>

      <section>
        <h2>4. Administrateurs et personnel</h2>
        <ul>
          <li>Compte : nom, e-mail, rôle, téléphone et service ; mot de passe stocké sous forme d&apos;empreinte.</li>
          <li>Sessions de connexion et journal des actions sensibles, pour la sécurité et le contrôle des accès.</li>
          <li>
            Les administrateurs n&apos;accèdent aux données des visiteurs et des clients que dans la mesure
            nécessaire à leur mission, selon leur rôle.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Prestataires et lieux de traitement</h2>
        <ul>
          <li>Supabase : base de données, hébergée en Allemagne (Francfort).</li>
          <li>Render : hébergement de l&apos;application.</li>
          <li>AlwaysData et Google (Gmail) : envoi des e-mails.</li>
          <li>
            Fournisseurs d&apos;IA, selon leur disponibilité : Groq, Google (Gemini), Cerebras, Hugging Face,
            OpenRouter. Ils reçoivent le texte nécessaire à la réponse, pas vos identifiants de compte.
          </li>
        </ul>
        <p>
          Certains de ces prestataires sont situés hors du Mali, notamment dans l&apos;Union européenne et aux
          États-Unis. Nous ne leur transmettons que ce qui est nécessaire au service.
        </p>
      </section>

      <section>
        <h2>6. Durées de conservation</h2>
        <ul>
          <li>Statistiques de visite : 13 mois au plus.</li>
          <li>Demandes, fiches de contact et inscriptions : le temps du traitement, puis 3 ans après le dernier échange.</li>
          <li>Compte client : tant que le compte est actif, puis suppression ou anonymisation sur demande ou après 3 ans d&apos;inactivité, sauf obligation légale de conservation (factures).</li>
          <li>Comptes administrateurs : la durée de la mission, puis désactivation.</li>
          <li>Newsletter : jusqu&apos;à votre désinscription.</li>
          <li>Conversation du chatbot dans votre navigateur : jusqu&apos;à ce que vous l&apos;effaciez.</li>
        </ul>
      </section>

      <section>
        <h2>7. Sécurité</h2>
        <p>
          Connexions chiffrées (HTTPS), mots de passe stockés sous forme d&apos;empreinte, mots de passe de
          messagerie chiffrés, base de données inaccessible depuis le navigateur en dehors du catalogue public,
          sessions limitées dans le temps et liens de réinitialisation à usage unique, valables une heure.
        </p>
      </section>

      <section>
        <h2>8. Vos droits</h2>
        <p>
          Conformément à la loi malienne n° 2013-015 du 21 mai 2013 relative à la protection des données à
          caractère personnel, vous pouvez demander l&apos;accès à vos données, leur rectification, leur
          suppression, vous opposer à leur traitement ou retirer votre consentement. Écrivez à{' '}
          <a href={`mailto:${LEGAL_CONTACT.email}`}>{LEGAL_CONTACT.email}</a> ; nous répondons dans un délai
          d&apos;un mois. Vous pouvez aussi saisir l&apos;Autorité de Protection des Données à caractère
          Personnel (APDP) du Mali.
        </p>
      </section>

      <section>
        <h2>9. Cookies</h2>
        <p>
          Le détail des cookies et du stockage utilisés figure dans la <Link href="/cookies">politique de cookies</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
