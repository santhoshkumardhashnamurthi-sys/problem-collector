import { NextResponse } from 'next/server';
import { excelService } from '@/lib/excel-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = await excelService.getExcelBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="problems.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('[API_PROBLEMS_EXPORT_ERROR] Failed to export problems.xlsx:', error);
    const message = error instanceof Error ? error.message : 'Failed to export Excel file';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
