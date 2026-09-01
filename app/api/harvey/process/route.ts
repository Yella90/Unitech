// app/api/harvey/process/route.ts
import { NextResponse } from 'next/server';
import { harvey } from '@/lib/agents/harvey';
import { authorizationErrorResponse, requirePermission } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    await requirePermission('email.create_response');
    const { emailId } = await request.json();
    const result = await harvey.generateResponse(emailId);
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
