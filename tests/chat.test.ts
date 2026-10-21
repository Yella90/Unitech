import { describe, expect, it } from 'vitest';
import { toMarkdown } from '@/lib/chat/client';
import { catalogueRecipient } from '@/lib/agents/harvey/catalogue';

describe('mise en forme des réponses du chatbot', () => {
  it('transforme les puces « • » en liste Markdown', () => {
    expect(toMarkdown('Offres :\n• Web\n• Mobile')).toBe('Offres :\n- Web\n- Mobile');
  });

  it('garde les retours à la ligne simples', () => {
    expect(toMarkdown('Ligne 1\nLigne 2')).toBe('Ligne 1  \nLigne 2');
  });

  it('ferme la liste avant le texte qui la suit', () => {
    expect(toMarkdown('- a\n- b\nSuite')).toBe('- a\n- b\n\nSuite');
  });
});

describe('demande de catalogue des formations', () => {
  const offer =
    "Parfait, je prépare le catalogue complet de nos formations. Pour vous l'envoyer, indiquez simplement l'adresse email.";

  it('envoie à l’adresse donnée après la proposition de HARVEY', () => {
    expect(catalogueRecipient('awa@example.com', [{ role: 'assistant', content: offer }])).toBe('awa@example.com');
  });

  it('accepte la demande et l’adresse dans le même message', () => {
    expect(catalogueRecipient('Envoyez le catalogue à Moussa@Example.org', [])).toBe('moussa@example.org');
  });

  it('ignore une adresse sans lien avec le catalogue', () => {
    expect(catalogueRecipient('Écrivez-moi à ali@example.com pour un devis', [])).toBeNull();
  });

  it('ignore une demande sans adresse', () => {
    expect(catalogueRecipient('Je veux le catalogue', [])).toBeNull();
  });
});
