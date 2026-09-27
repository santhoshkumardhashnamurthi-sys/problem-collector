import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { excelService } from '@/lib/excel/excel-service';
import { problemSubmissionSchema } from '@/lib/validation/problem';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { ZodError } from 'zod';

/**
 * Public problem browsing is strictly disabled by architecture.
 * Public users cannot query or list other people's submissions.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden. Public problem browsing is disabled on ARTIX.',
    },
    { status: 403 }
  );
}

/**
 * Main public problem submission endpoint.
 * Accepts problem friction report, validates, rate limits, saves to DB & Excel,
 * and returns success with the generated problemCode (e.g. ARTIX-000001).
 */
export async function POST(request: NextRequest) {
  // 1. IP Rate Limiting (e.g. 10 per hour per IP)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many submissions. Please try again in ${Math.ceil(rateCheck.resetInSec / 60)} minutes.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.resetInSec),
        },
      }
    );
  }

  try {
    const rawBody = await request.json();

    // Support both canonical and friendly field names
    const normalizedInput = {
      raw_description: (rawBody.description || rawBody.raw_description || '').trim(),
      category: rawBody.category,
      user_type: rawBody.whoFacesThis || rawBody.user_type,
      frequency: rawBody.frequency,
      location: rawBody.location ? String(rawBody.location).trim().slice(0, 100) : null,
    };

    const validated = problemSubmissionSchema.parse(normalizedInput);

    const result = await repository.submitProblem(validated);

    // Sync to master Excel file on server
    try {
      await excelService.appendProblem(result.problem, () => repository.getProblems({ limit: 10000 }));
    } catch (excelErr) {
      console.warn('[EXCEL_SYNC_WARNING] Master Excel update notice:', excelErr);
    }

    // Return clean public confirmation - NEVER expose internal database details or other records
    return NextResponse.json({
      success: true,
      message: 'Problem submitted successfully',
      problemCode: result.problem.problem_code,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0]?.message || 'Validation failed';
      return NextResponse.json(
        { success: false, error: firstIssue, details: error.issues },
        { status: 400 }
      );
    }
    console.error('[API_ERROR] Problem submission failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit problem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
