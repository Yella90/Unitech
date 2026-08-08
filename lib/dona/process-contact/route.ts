// app/api/dona/process-contact/route.ts
import { NextResponse } from 'next/server';
import { dona } from '@/lib/dona/processor';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ✅ Vérifier que l'ID est présent
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID du contact requis' },
        { status: 400 }
      );
    }

    const result = await dona.processContact({
      id: body.id,
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}