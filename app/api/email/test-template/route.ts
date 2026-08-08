// app/api/email/test-template/route.ts
import { NextResponse } from 'next/server';
import { sendEmailWithTemplate } from '@/lib/email/sendgrid';

export async function GET() {
  try {
    const templates = ['newsletter', 'confirmation', 'support'];
    const results = [];

    for (const template of templates) {
      let data = {};
      
      switch (template) {
        case 'newsletter':
          data = {
            title: 'Newsletter UNITECH - Test',
            content: 'Ceci est un test de la newsletter UNITECH avec le template personnalisé.',
            subject: '📬 Test Newsletter UNITECH'
          };
          break;
        case 'confirmation':
          data = {
            name: 'Utilisateur Test'
          };
          break;
        case 'support':
          data = {
            response: 'Votre demande a bien été prise en compte. Notre équipe va vous répondre dans les plus brefs délais.'
          };
          break;
      }

      const result = await sendEmailWithTemplate(
        'doumbialayesoma@gmail.com',
        template as 'newsletter' | 'confirmation' | 'support',
        data
      );

      results.push({ template, success: true, result });
    }

    return NextResponse.json({
      success: true,
      message: 'Tous les templates ont été testés avec succès',
      results
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}