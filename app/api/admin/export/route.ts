import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getProblemsFromMongoDB } from '@/lib/db/mongodb';
import { excelService } from '@/lib/excel/excel-service';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const category = searchParams.get('category') || undefined;

    let problems = await getProblemsFromMongoDB({ limit: 10000 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (filter === 'today') {
      problems = problems.filter((p) => new Date(p.created_at) >= todayStart);
    } else if (filter === 'week') {
      problems = problems.filter((p) => new Date(p.created_at) >= weekStart);
    } else if (filter === 'month') {
      problems = problems.filter((p) => new Date(p.created_at) >= monthStart);
    } else if (filter === 'category' && category) {
      problems = problems.filter(
        (p) => (p.category_name || '').toLowerCase() === category.toLowerCase()
      );
    }

    const buffer = await excelService.generateProblemsExportBuffer(problems);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="problems.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_EXPORT_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
