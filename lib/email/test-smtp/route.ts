// app/api/email/test-smtp/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/smtp';

export async function GET() {
  try {
    const result = await sendEmail({
      to: 'doumbialayesoma@gmail.com',
      subject: 'Test SMTP Alwaysdata',
      html: `
        <h1>✅ Test réussi !</h1>
        <p>Email envoyé via Alwaysdata SMTP.</p>
        <p>Serveur : smtp-unitech.alwaysdata.net</p>
        <p>Date : ${new Date().toLocaleString()}</p>
      `,
      category: 'test',
    });

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      result,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}