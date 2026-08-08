// app/api/emails/process/route.ts
import { NextResponse } from 'next/server';
import { processPendingEmails } from '@/lib/email/processor';

export async function POST() {
  try {
    await processPendingEmails();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}