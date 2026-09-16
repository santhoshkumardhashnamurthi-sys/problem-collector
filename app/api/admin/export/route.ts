import { NextRequest, NextResponse } from 'next/server';
import { excelService } from '@/lib/excel-service';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all | today | week | month | category
    const category = searchParams.get('category') || undefined;

    // If unfiltered 'all', stream the master problems.xlsx directly
    if (filter === 'all' && !category) {
      const buffer = await excelService.getExcelBuffer();
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="problems.xlsx"',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Otherwise, filter records from problems.xlsx
    let rows = await excelService.getAllProblems();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (filter === 'today') {
      rows = rows.filter((r) => {
        const [d, m, y] = r.date.split('-').map(Number);
        return new Date(y, m - 1, d) >= todayStart;
      });
    } else if (filter === 'week') {
      rows = rows.filter((r) => {
        const [d, m, y] = r.date.split('-').map(Number);
        return new Date(y, m - 1, d) >= weekStart;
      });
    } else if (filter === 'month') {
      rows = rows.filter((r) => {
        const [d, m, y] = r.date.split('-').map(Number);
        return new Date(y, m - 1, d) >= monthStart;
      });
    } else if (filter === 'category' && category) {
      rows = rows.filter((r) => (r.category || '').toLowerCase() === category.toLowerCase());
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Problems');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Problem', key: 'problem', width: 50 },
      { header: 'Location', key: 'location', width: 22 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Contact', key: 'contact', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    rows.forEach((r) => {
      sheet.addRow([r.id, r.date, r.time, r.category, r.problem, r.location, r.name, r.contact, r.status]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `problems_${filter}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_EXPORT_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
