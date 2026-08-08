// app/api/email/incoming/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processIncomingEmail } from '@/lib/email/processor-optimized';

// ✅ Exporter la méthode POST correctement
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string || 'Sans sujet';
    const text = formData.get('text') as string || '';
    const html = formData.get('html') as string || '';

    if (!from || !to) {
      console.error('❌ Email invalide:', { from, to });
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    console.log(`📧 Nouvel email reçu de ${from} - Sujet: ${subject}`);

    const result = await processIncomingEmail({
      from,
      to,
      subject,
      body: text || html,
      html: html || undefined,
    });

    console.log(`✅ Email traité: ${result.action}`);

    return NextResponse.json({
      success: true,
      action: result.action,
      email_id: result.email_id,
      assigned_agent: result.assigned_agent,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}

// ✅ Optionnel : Ajouter une méthode GET pour tester
export async function GET() {
  return NextResponse.json({
    message: 'API Incoming Email - Utilisez POST pour recevoir des emails',
    status: 'active'
  });
}