import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { repository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const problems = await repository.getProblems({ limit: 10000 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    const categoryDistribution: Record<string, number> = {};
    const whoFacesDistribution: Record<string, number> = {};
    const frequencyDistribution: Record<string, number> = {};

    for (const p of problems) {
      const pTime = new Date(p.created_at).getTime();
      if (!isNaN(pTime)) {
        if (pTime >= startOfToday) todayCount++;
        if (pTime >= sevenDaysAgo) weekCount++;
        if (pTime >= thirtyDaysAgo) monthCount++;
      }

      const cat = p.category_name || 'Other';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

      const userType = p.user_type || 'Everyone';
      whoFacesDistribution[userType] = (whoFacesDistribution[userType] || 0) + 1;

      const freq = p.frequency || 'Daily';
      frequencyDistribution[freq] = (frequencyDistribution[freq] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProblems: problems.length,
        todayCount,
        weekCount,
        monthCount,
        categoryDistribution,
        whoFacesDistribution,
        frequencyDistribution,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compute admin statistics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
