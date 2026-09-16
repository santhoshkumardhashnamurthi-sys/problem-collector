import { NextRequest, NextResponse } from 'next/server';
import { problemSubmissionSchema } from '@/lib/validation/problem';
import { excelService } from '@/lib/excel-service';
import { repository } from '@/lib/db/repository';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const city = searchParams.get('city') || undefined;
    const sort = searchParams.get('sort') as any;

    const problems = await repository.getProblems({
      search,
      category,
      city,
      sort,
    });

    return NextResponse.json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error: unknown) {
    console.error('[API_GET_PROBLEMS_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch problems';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = problemSubmissionSchema.parse(body);

    const result = await repository.submitProblem(validated);

    return NextResponse.json({
      success: true,
      message: 'Problem submitted successfully',
      id: Number(result.problem.id),
      problem: result.problem,
      cluster: result.cluster,
      analysis: result.analysis,
    });
  } catch (error: unknown) {
    console.error('[API_ERROR] Problem submission failed:', error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to submit problem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
