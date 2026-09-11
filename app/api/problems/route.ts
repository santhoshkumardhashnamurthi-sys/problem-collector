

import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { excelService } from '@/lib/excel/excel-service';
import { problemSubmissionSchema } from '@/lib/validation/problem';
import { ProblemSortOption } from '@/lib/db/schema';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const user_type = searchParams.get('user_type') || undefined;
    const frequency = searchParams.get('frequency') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const city = searchParams.get('city') || undefined;
    const sort = (searchParams.get('sort') as ProblemSortOption) || 'most_recent';

    const problems = await repository.getProblems({
      search,
      category,
      user_type,
      frequency,
      severity,
      city,
      sort,
    });

    return NextResponse.json({ success: true, count: problems.length, problems });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problems';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = problemSubmissionSchema.parse(body);

    const result = await repository.submitProblem(validated);

    // Synchronize with master Problem_Collector_Data.xlsx ONLY if Supabase insert succeeded
    try {
      await excelService.appendProblem(result.problem, () => repository.getProblems());
    } catch (excelErr) {
      console.warn('[EXCEL_SYNC_WARNING] Master Excel update warning:', excelErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Problem collected successfully. Your problem has been added to the ARTIX problem database.',
      problem: result.problem,
      cluster: result.cluster,
      analysis: result.analysis,
    });
  } catch (error: unknown) {
    console.error('[API_ERROR] Problem submission failed:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to submit problem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
