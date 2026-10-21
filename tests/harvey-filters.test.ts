import { describe, expect, it } from 'vitest';
import { automatedSenderReason, cleanGeneratedReply, headersForStorage } from '@/lib/agents/harvey-v2/email-filters';

const MAILBOX = 'contact@unitech.ml';

describe('expéditeurs automatiques', () => {
  it('écarte les adresses no-reply et notifications', () => {
    for (const from of [
      'noreply@supabase.com',
      'no-reply-WS4hpZplngB7emHkfJLE8Q@mail.anthropic.com',
      'google-maps-noreply@google.com',
      'notifications-noreply@linkedin.com',
      'mailer-daemon@googlemail.com',
      'subscribe@fr.jooble.org',
      'welcome@overleaf.com',
    ]) {
      expect(automatedSenderReason({ from_email: from }, MAILBOX), from).toBe('adresse automatique');
    }
  });

  it('écarte les sous-domaines d’envoi en masse', () => {
    expect(automatedSenderReason({ from_email: 'welcomes@engage.canva.com' }, MAILBOX)).toBe('domaine d’envoi en masse');
    expect(automatedSenderReason({ from_email: 'rewards@notifyemail.microsoft.com' }, MAILBOX)).toBe('domaine d’envoi en masse');
  });

  it('écarte les envois en nombre, même quand la mention n’est que dans le HTML', () => {
    expect(automatedSenderReason({ from_email: 'hello@chess.com', body_text: 'Click here to unsubscribe.' }, MAILBOX)).toMatch(/envoi en nombre/);
    expect(
      automatedSenderReason(
        { from_email: 'design@canva.com', body_text: 'Bonjour', body_html: '<a href="x"><span>Se d&eacute;sabonner</span></a>' },
        MAILBOX
      )
    ).toMatch(/envoi en nombre/);
    expect(automatedSenderReason({ from_email: 'x@qualtrics.com', body: 'Change your email preferences' }, MAILBOX)).toMatch(/envoi en nombre/);
  });

  it('écarte les en-têtes de liste et de réponse automatique', () => {
    expect(automatedSenderReason({ from_email: 'team@acme.com', headers: { 'List-Unsubscribe': '<mailto:u@acme.com>' } }, MAILBOX)).toBe('liste de diffusion');
    expect(automatedSenderReason({ from_email: 'team@acme.com', headers: { 'auto-submitted': 'auto-replied' } }, MAILBOX)).toBe('en-tête Auto-Submitted');
    expect(automatedSenderReason({ from_email: 'team@acme.com', headers: { 'auto-submitted': 'no' } }, MAILBOX)).toBeNull();
  });

  it('écarte les messages que la boîte s’envoie à elle-même', () => {
    expect(automatedSenderReason({ from_email: 'Contact@Unitech.ml' }, MAILBOX)).toBe('envoyé par la boîte elle-même');
  });

  it('répond aux vraies personnes', () => {
    for (const from of ['mykdevconsulting@gmail.com', 'directeur@ecole.ml', 'newsroom@media.ml', 'info@entreprise.com']) {
      expect(
        automatedSenderReason({ from_email: from, body_text: 'Bonjour, je souhaite un devis pour un site web.' }, MAILBOX),
        from
      ).toBeNull();
    }
  });
});

describe('enregistrement des en-têtes', () => {
  it('convertit la Map de mailparser et ne garde que les en-têtes utiles', () => {
    const headers = new Map<string, unknown>([
      ['list-unsubscribe', { url: 'https://x/u' }],
      ['precedence', 'bulk'],
      ['received', 'from mx…'],
    ]);
    expect(headersForStorage(headers)).toEqual({ 'list-unsubscribe': '{"url":"https://x/u"}', precedence: 'bulk' });
    expect(headersForStorage(undefined)).toEqual({});
  });
});

describe('nettoyage des réponses générées', () => {
  it('retire la ligne d’objet placée en tête', () => {
    expect(cleanGeneratedReply('Subject: Re: Devis  \n\nBonjour,\nMerci.')).toBe('Bonjour,\nMerci.');
    expect(cleanGeneratedReply('**Objet :** Votre demande\r\nBonjour')).toBe('Bonjour');
  });

  it('ne touche pas au reste du texte', () => {
    const text = 'Bonjour,\n\nObjet de votre demande : un devis.\nCordialement';
    expect(cleanGeneratedReply(text)).toBe(text);
  });
});
