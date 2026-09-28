import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/security/auth';
import { getMongoDiagnostic, isMongoConfigured } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasMongoUri = isMongoConfigured();

  // Mask MongoDB URI for secure inspection
  let maskedHost = 'none';
  let databaseName = 'none';
  if (process.env.MONGODB_URI) {
    try {
      const u = new URL(process.env.MONGODB_URI.replace('mongodb+srv://', 'https://'));
      maskedHost = u.hostname;
      databaseName = u.pathname.replace(/^\//, '') || 'default';
    } catch {
      maskedHost = 'mongodb-cluster';
    }
  }

  const diagnosticResult = {
    hasMongoUri,
    databaseType: 'MongoDB Atlas',
    envVarNames: [
      process.env.MONGODB_URI ? 'MONGODB_URI' : null,
      process.env.ADMIN_USERNAME ? 'ADMIN_USERNAME' : null,
      process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : null,
      process.env.SESSION_SECRET ? 'SESSION_SECRET' : null,
    ].filter(Boolean),
    connectionInfo: {
      host: maskedHost,
      database: databaseName,
    },
    mongoDetails: await getMongoDiagnostic(),
  };

  return NextResponse.json(diagnosticResult);
}
