import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getDatabaseStatsUnified } from '@/lib/db/unified-db';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const stats = await getDatabaseStatsUnified();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compute admin statistics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

