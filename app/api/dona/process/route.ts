// app/api/dona/process/route.ts
import { NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await dona.processEmail(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}