import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { excelService } from '@/lib/excel-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await repository.checkStorageHealth();
    return NextResponse.json({
      success: true,
      health,
      message: 'Excel storage (data/problems.xlsx) is online and active.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Storage check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await excelService.ensureInitialized();
    const rows = await excelService.getAllProblems();
    return NextResponse.json({
      success: true,
      health: { configured: true, connected: true, tablesExist: true },
      syncedCount: rows.length,
      message: `Excel storage verified: ${rows.length} problem(s) in data/problems.xlsx.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
