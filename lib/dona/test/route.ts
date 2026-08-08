// app/api/dona/test/route.ts
import { NextResponse } from 'next/server';
import { dona } from '@/lib/dona/processor';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await dona.analyze({
      from: body.from || 'test@example.com',
      subject: body.subject || 'Test',
      body: body.body || 'Ceci est un test',
      source: 'email',
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}