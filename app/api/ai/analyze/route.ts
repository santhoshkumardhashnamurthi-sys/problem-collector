import { NextRequest, NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const { description, category, user_type, frequency } = await request.json();

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Problem description must be at least 5 characters' },
        { status: 400 }
      );
    }

    const analysis = await aiProvider.analyzeProblem(description, category, user_type, frequency);
    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
