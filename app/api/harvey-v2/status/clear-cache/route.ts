// app/api/harvey-v2/clear-cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { harveyV2 } from '@/lib/agents/harvey-v2/HarveyV2';
import { authenticateClient } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { emailId } = await req.json();

    // 2. Nettoyer le cache
    if (emailId) {
      // Supprimer un email spécifique du cache
      const deleted = harveyV2['processedEmails'].delete(emailId);
      
      // Recharger le cache depuis la base
      await harveyV2['loadProcessedEmails']();
      
      return NextResponse.json({
        success: true,
        message: deleted ? `Email ${emailId} supprimé du cache` : `Email ${emailId} non trouvé dans le cache`,
        processedEmailsCount: harveyV2['processedEmails'].size
      });
    } else {
      // Nettoyer tout le cache
      harveyV2['processedEmails'].clear();
      await harveyV2['loadProcessedEmails']();
      
      return NextResponse.json({
        success: true,
        message: 'Cache entièrement nettoyé',
        processedEmailsCount: harveyV2['processedEmails'].size
      });
    }
  } catch (error: any) {
    console.error('❌ Erreur clear cache:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}