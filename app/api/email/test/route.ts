// app/api/email/test/route.ts
import { NextResponse } from 'next/server';
import { sendEmail, sendEmailWithTemplate } from '@/lib/email/sendgrid';

export async function GET() {
  try {
    // Test 1: Email simple
    const result1 = await sendEmail({
      to: 'doumbialayesoma@gmail.com',
      subject: 'Test UNITECH - Email simple',
      html: '<h1>Test réussi !</h1><p>Ceci est un email de test depuis UNITECH.</p>'
    });

    // Test 2: Email avec template newsletter
    const result2 = await sendEmailWithTemplate(
      'doumbialayesoma@gmail.com',
      'newsletter',
      {
        title: 'Newsletter de test',
        content: 'Ceci est un test de la newsletter UNITECH.',
        subject: '📬 Test Newsletter UNITECH'
      }
    );

    // Test 3: Email de confirmation
    const result3 = await sendEmailWithTemplate(
      'doumbialayesoma@gmail.com',
      'confirmation',
      {
        name: 'Utilisateur Test'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Tous les emails ont été envoyés avec succès',
      results: {
        simple: result1,
        newsletter: result2,
        confirmation: result3
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        message: 'Erreur lors de l\'envoi des emails de test'
      },
      { status: 500 }
    );
  }
}