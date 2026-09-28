import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getMongoDatabaseStats } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const stats = await getMongoDatabaseStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    console.error('[ADMIN_STATS_ERROR] Failed to compute admin statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute admin statistics' },
      { status: 500 }
    );
  }
}


