// app/api/harvey-v2/status/route.ts
// Route pour vérifier le statut de Harvey V2

import { NextRequest, NextResponse } from 'next/server';
import { getHarveyV2Metrics, isHarveyV2Running } from '@/lib/agents/harvey-v2/auto-start';
import { authenticateAdmin } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    // Authentification admin requise
    const auth = await authenticateAdmin(req);
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const metrics = getHarveyV2Metrics();
    const isRunning = isHarveyV2Running();

    return NextResponse.json({
      success: true,
      data: {
        isRunning,
        metrics
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}