import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getDatabaseConnectionString, ensureDatabaseSchema } from '@/lib/db/unified-db';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = getDatabaseConnectionString();
  const hasDbUrl = Boolean(dbUrl);

  // Mask credentials for security
  let host = 'none';
  let database = 'none';
  let user = 'none';
  let sslMode = 'unknown';

  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      host = u.hostname;
      database = u.pathname.replace(/^\//, '');
      user = u.username;
      sslMode = u.searchParams.get('sslmode') || 'default';
    } catch {
      host = 'valid_connection_string';
    }
  }

  const diagnosticResult = {
    hasDatabaseUrl: hasDbUrl,
    envVarNames: [
      process.env.DATABASE_URL ? 'DATABASE_URL' : null,
      process.env.POSTGRES_URL ? 'POSTGRES_URL' : null,
      process.env.POSTGRES_PRISMA_URL ? 'POSTGRES_PRISMA_URL' : null,
      process.env.POSTGRES_URL_NON_POOLING ? 'POSTGRES_URL_NON_POOLING' : null,
      process.env.POSTGRES_HOST ? 'POSTGRES_HOST' : null,
      process.env.KV_REST_API_URL ? 'KV_REST_API_URL' : null,
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    ].filter(Boolean),

    connectionInfo: {
      host,
      database,
      user,
      sslMode,
    },
    connectionTest: 'pending' as string,
    error: null as string | null,
    tablesFound: [] as string[],
    recordsCount: 0,
    latestCodes: [] as string[],
  };

  if (!dbUrl) {
    diagnosticResult.connectionTest = 'NO_DATABASE_URL_CONFIGURED';
    diagnosticResult.error = 'No DATABASE_URL or POSTGRES_URL found in environment variables';
    return NextResponse.json(diagnosticResult);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    try {
      diagnosticResult.connectionTest = 'SUCCESS';

      // Ensure tables and baseline records exist automatically
      await ensureDatabaseSchema();

      // Check tables
      const { rows: tables } = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
      diagnosticResult.tablesFound = tables.map((t: { table_name: string }) => t.table_name);

      // Check artix_problems
      if (diagnosticResult.tablesFound.includes('artix_problems')) {
        const { rows: countRows } = await client.query('SELECT COUNT(*) AS c FROM artix_problems');
        diagnosticResult.recordsCount = parseInt(countRows[0].c, 10);

        const { rows: codeRows } = await client.query('SELECT problem_code FROM artix_problems ORDER BY created_at DESC LIMIT 10');
        diagnosticResult.latestCodes = codeRows.map((r: { problem_code: string }) => r.problem_code);
      } else if (diagnosticResult.tablesFound.includes('problems')) {
        const { rows: countRows } = await client.query('SELECT COUNT(*) AS c FROM problems');
        diagnosticResult.recordsCount = parseInt(countRows[0].c, 10);

        const { rows: codeRows } = await client.query('SELECT problem_code FROM problems ORDER BY created_at DESC LIMIT 10');
        diagnosticResult.latestCodes = codeRows.map((r: { problem_code: string }) => r.problem_code);
      }
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    diagnosticResult.connectionTest = 'FAILED';
    diagnosticResult.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  } finally {
    await pool.end().catch(() => {});
  }

  return NextResponse.json(diagnosticResult);
}
