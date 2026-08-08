// app/api/emails/send/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';

export async function POST(request: Request) {
  try {
    const { to, subject, text, html, category } = await request.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Champs manquants' },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      category,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}