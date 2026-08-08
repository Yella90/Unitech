// app/api/email/test-simple/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';

export async function GET() {
  try {
    const result = await sendEmail({
      to: 'doumbialayesoma@gmail.com',
      subject: 'Test UNITECH',
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f5f7fb; padding: 20px; border-radius: 12px; }
          .header { background: #1E3A8A; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 UNITECH</h1>
            <p>Solutions technologiques innovantes</p>
          </div>
          <div class="content">
            <h2>✅ Test réussi !</h2>
            <p>Ceci est un email de test envoyé depuis le système UNITECH.</p>
            <p>Date et heure : ${new Date().toLocaleString()}</p>
            <p>Le système d'envoi d'emails fonctionne correctement.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} UNITECH. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}