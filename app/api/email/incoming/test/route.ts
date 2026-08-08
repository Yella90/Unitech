// app/api/email/incoming/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processIncomingEmail } from '@/lib/email/processor-optimized';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await processIncomingEmail({
      from: body.from || 'test@example.com',
      to: body.to || 'contact@unitech.com',
      subject: body.subject || 'Test email',
      body: body.body || 'Ceci est un email de test',
      html: body.html || undefined,
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Route de test - Utilisez POST pour simuler un email entrant'
  });
}