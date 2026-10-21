// app/(public)/cookies/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/public/LegalPage';
import ManageCookiesButton from '@/components/public/ManageCookiesButton';

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Les cookies et le stockage utilisés par le site UNITECH, et comment gérer votre choix.',
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Politique de cookies"
      updated="21 octobre 2026"
      current="/cookies"
      intro={
        <p>
          Le site utilise peu de cookies : ceux qui font fonctionner la connexion et le chatbot, et, seulement
          avec votre accord, une mesure d&apos;audience interne. Aucun cookie publicitaire, aucun traceur de
          réseau social.
        </p>
      }
    >
      <section>
        <h2>1. Nécessaires au fonctionnement</h2>
        <p>Ils ne peuvent pas être refusés : sans eux, la connexion ou le chatbot ne fonctionnent pas.</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Pour qui</th>
                <th>Rôle</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>session_token</code> (cookie)</td>
                <td>Administrateurs</td>
                <td>Maintenir la connexion à l&apos;espace d&apos;administration</td>
                <td>7 jours ou déconnexion</td>
              </tr>
              <tr>
                <td><code>client_session_token</code> (cookie)</td>
                <td>Clients</td>
                <td>Maintenir la connexion à l&apos;espace client</td>
                <td>7 jours ou déconnexion</td>
              </tr>
              <tr>
                <td><code>unitech_chat_history</code>, <code>unitech_chat_session</code> (stockage du navigateur)</td>
                <td>Visiteurs</td>
                <td>Garder la conversation avec HARVEY et la rattacher à votre demande</td>
                <td>Jusqu&apos;à ce que vous effaciez la conversation</td>
              </tr>
              <tr>
                <td><code>unitech_consent</code> (stockage du navigateur)</td>
                <td>Tous</td>
                <td>Mémoriser votre choix sur la mesure d&apos;audience</td>
                <td>Jusqu&apos;à ce que vous le changiez</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Les cookies de connexion sont inaccessibles aux scripts de la page (HttpOnly) et transmis uniquement en
          HTTPS.
        </p>
      </section>

      <section>
        <h2>2. Mesure d&apos;audience (avec votre accord)</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>visitor_id</code> (stockage du navigateur)</td>
                <td>Identifiant aléatoire pour compter les visiteurs et les pages vues</td>
                <td>Jusqu&apos;au refus ou à l&apos;effacement ; données conservées 13 mois au plus</td>
              </tr>
              <tr>
                <td><code>session_id</code> (stockage de session)</td>
                <td>Regrouper les pages vues pendant une même visite</td>
                <td>Fermeture de l&apos;onglet</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Ces statistiques restent chez UNITECH : elles ne sont partagées avec aucun service de publicité ou de
          mesure tiers. Si vous refusez, rien n&apos;est mesuré et l&apos;identifiant déjà posé est supprimé.
        </p>
      </section>

      <section>
        <h2>3. Gérer votre choix</h2>
        <p>
          Vous pouvez modifier votre choix à tout moment, ici ou via « Gérer les cookies » en bas de chaque page.
          Vous pouvez aussi effacer les cookies et le stockage du site depuis les réglages de votre navigateur.
        </p>
        <div className="mt-4">
          <ManageCookiesButton />
        </div>
      </section>

      <section>
        <h2>4. En savoir plus</h2>
        <p>
          L&apos;utilisation de vos données est détaillée dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
