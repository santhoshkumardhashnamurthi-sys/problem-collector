import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getProblemsFromDatabase } from '@/lib/db/unified-db';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const user_type = searchParams.get('user_type') || undefined;
    const frequency = searchParams.get('frequency') || undefined;

    const problems = await getProblemsFromDatabase({
      search,
      category,
      user_type,
      frequency,
      limit: 1000,
    });

    return NextResponse.json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin problems';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

