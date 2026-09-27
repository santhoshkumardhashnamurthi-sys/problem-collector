import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const health = await repository.checkSupabaseHealth();
    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const health = await repository.checkSupabaseHealth();
    if (!health.tablesExist) {
      return NextResponse.json({
        success: false,
        health,
        message:
          'Cannot sync yet: tables have not been created in Supabase. Please run supabase/apply_to_supabase.sql in your Supabase SQL Editor.',
      }, { status: 400 });
    }

    const syncResult = await repository.syncUnsyncedToSupabase();
    return NextResponse.json({
      success: true,
      health,
      ...syncResult,
      message: `Successfully synchronized ${syncResult.syncedCount} problem(s) to Supabase.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
