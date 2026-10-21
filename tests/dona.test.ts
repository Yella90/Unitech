import { beforeAll, describe, expect, it } from 'vitest';
import { Dona } from '@/lib/agents/dona/processor';

// Sans base de données accessible, DONA utilise ses mots-clés par défaut
const dona = new Dona();

beforeAll(async () => {
  await dona.init();
});

async function category(message: string) {
  return (await dona.analyze({ body: message, source: 'email' })).category;
}

describe('classification DONA', () => {
  it('reconnaît une question sur les formations', async () => {
    expect(await category('Quelles formations proposez-vous ?')).toBe('formation');
  });

  it('reconnaît une demande de support, accents compris', async () => {
    expect(await category('Mon application ne marche pas, gros problème')).toBe('support');
  });

  it('reconnaît une demande commerciale', async () => {
    expect(await category('Je voudrais un devis et vos tarifs')).toBe('commercial');
  });

  it('reconnaît une question sur le fondateur', async () => {
    expect(await category('Qui est le fondateur ?')).toBe('founder');
  });

  it('ne classe pas en spam sur un seul mot ambigu', async () => {
    expect(await category('Cette promotion est-elle encore valable ?')).not.toBe('spam');
  });

  it('classe le spam évident', async () => {
    expect(await category('Gagnez au casino, cliquez ici')).toBe('spam');
  });

  it('ne confond plus « des » avec « désinscription »', async () => {
    const result = await dona.analyze({ body: 'Je voudrais des renseignements', source: 'email' });
    expect(result.category).not.toBe('newsletter');
  });

  it('garde les salutations en dernier recours', async () => {
    expect(await category('Bonjour, je veux un devis')).toBe('commercial');
    expect(await category('Bonjour')).toBe('general');
  });
});
