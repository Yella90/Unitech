// app/api/email/test-imap/route.ts
import { NextResponse } from 'next/server';
import { fetchEmailsFromIMAP } from '@/lib/email/imap';

export async function GET() {
  try {
    await fetchEmailsFromIMAP();
    return NextResponse.json({
      success: true,
      message: 'Récupération IMAP terminée',
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}