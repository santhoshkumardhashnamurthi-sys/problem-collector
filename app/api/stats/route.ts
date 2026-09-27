import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { repository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  // Public statistics are strictly disabled. Admin access only.
  if (!verifyAdminSession(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden. Public statistics are disabled on ARTIX.',
      },
      { status: 403 }
    );
  }

  try {
    const stats = await repository.getDatabaseStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
