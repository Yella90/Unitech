// app/api/dona/process/route.ts
import { NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona';
import { authorizationErrorResponse, requirePermission } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    await requirePermission('ai.approve');
    const body = await request.json();
    const result = await dona.processEmail(body);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
