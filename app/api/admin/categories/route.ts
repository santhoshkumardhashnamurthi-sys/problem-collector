import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { repository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const categories = await repository.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin categories';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
