// app/api/harvey/process/route.ts
import { NextResponse } from 'next/server';
import { harvey } from '@/lib/agents/harvey';

export async function POST(request: Request) {
  try {
    const { emailId } = await request.json();
    const result = await harvey.generateResponse(emailId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}