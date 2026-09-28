// =============================================================================
// ARTIX MongoDB Atlas Production Engine
// Brand: CodeArtix | Founder: Santhoshkumar Dhashnamurthi
// Single source of truth for Public Problem Submissions and Admin Dashboard
// Provides atomic sequence counter, concurrency safety, and zero data loss
// =============================================================================

import { MongoClient, Db, Collection } from 'mongodb';
import { Problem } from './schema';
import { BASELINE_PROBLEMS } from './baseline-problems';
import crypto from 'crypto';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cachedDb: Db | null = null;
let isInitialized = false;

/**
 * Returns whether MONGODB_URI is provided in environment variables
 */
export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

/**
 * Gets or initializes the cached MongoDB Client suitable for Vercel serverless functions
 */
export function getMongoClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 15,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }
}

/**
 * Gets the MongoDB database instance from the cached client
 */
export async function getMongoDb(): Promise<Db | null> {
  if (cachedDb) return cachedDb;
  const clientPromise = getMongoClientPromise();
  if (!clientPromise) return null;

  const client = await clientPromise;
  // Automatically uses database specified in URI or defaults to 'artix_problem_collector'
  cachedDb = client.db();
  return cachedDb;
}

/**
 * Ensures indexes exist on the problems and counters collections,
 * and preserves all 12 historical baseline records without duplication.
 */
export async function ensureMongoIndexesAndBaseline(): Promise<void> {
  if (isInitialized) return;
  const db = await getMongoDb();
  if (!db) return;

  const problemsCol: Collection = db.collection('problems');
  const countersCol: Collection = db.collection('counters');

  // 1. Create unique indexes to guarantee zero duplicate Problem IDs
  try {
    await problemsCol.createIndex({ problem_code: 1 }, { unique: true });
  } catch {
    // Index may already exist
  }

  try {
    await problemsCol.createIndex({ problemId: 1 }, { unique: true, sparse: true });
  } catch {
    // Index may already exist
  }

  try {
    await problemsCol.createIndex({ created_at: -1 });
  } catch {
    // Index may already exist
  }

  // 2. Preserve & seed all 12 baseline records if not already in MongoDB
  for (const b of BASELINE_PROBLEMS) {
    await problemsCol.updateOne(
      { problem_code: b.problem_code },
      {
        $setOnInsert: {
          id: b.id || crypto.randomUUID(),
          problemId: b.problem_code,
          problem_code: b.problem_code,
          user_id: b.user_id || null,
          submitter_name: b.submitter_name || 'Community Member',
          raw_description: b.raw_description,
          description: b.raw_description,
          title: b.raw_description.slice(0, 100),
          normalized_problem: b.normalized_problem || b.raw_description,
          category_id: b.category_id || null,
          category_name: b.category_name || 'General',
          category: b.category_name || 'General',
          subcategory: b.subcategory || null,
          user_type: b.user_type || 'Everyone',
          whoFacesThis: b.user_type || 'Everyone',
          frequency: b.frequency || 'Daily',
          severity: b.severity || 'Moderate',
          city: b.city || null,
          area: b.area || null,
          pincode: b.pincode || null,
          location: [b.area, b.city].filter(Boolean).join(', ') || null,
          is_anonymous: b.is_anonymous !== false,
          ai_processed: true,
          status: b.status || 'active',
          submittedAt: b.created_at || new Date().toISOString(),
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString(),
          supports_count: b.supports_count || 1,
          signal_score: b.signal_score || 80,
        },
      },
      { upsert: true }
    );
  }

  // 3. Initialize or sync atomic sequence counter
  // Finds the highest existing ARTIX numeric ID in the collection (minimum 12)
  const allProblems = await problemsCol.find({}, { projection: { problem_code: 1 } }).toArray();
  let maxSeq = 12;
  for (const p of allProblems) {
    if (typeof p.problem_code === 'string') {
      const match = p.problem_code.match(/^ARTIX-(\d{6})$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  }

  const existingCounter = await countersCol.findOne({ _id: 'problemId' as any });
  if (!existingCounter) {
    await countersCol.insertOne({ _id: 'problemId' as any, seq: maxSeq });
  } else if ((existingCounter.seq || 0) < maxSeq) {
    await countersCol.updateOne(
      { _id: 'problemId' as any },
      { $set: { seq: maxSeq } }
    );
  }

  isInitialized = true;
}

export interface NewProblemInput {
  raw_description: string;
  category: string;
  user_type: string;
  frequency: string;
  location?: string | null;
}

/**
 * Atomically generates the next unique Problem ID in MongoDB Atlas using findOneAndUpdate.
 * Strictly concurrency-safe. Guarantees ARTIX-000013, then ARTIX-000014, ARTIX-000015, etc.
 */
export async function getNextProblemIdAtomic(db: Db): Promise<string> {
  const countersCol = db.collection('counters');

  const result = await countersCol.findOneAndUpdate(
    { _id: 'problemId' as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seqVal = result?.seq ?? (result as any)?.value?.seq;
  if (typeof seqVal !== 'number') {
    throw new Error('Failed to retrieve incremented sequence value from MongoDB counters.');
  }

  return `ARTIX-${String(seqVal).padStart(6, '0')}`;
}

/**
 * Submits a new problem into MongoDB Atlas.
 * Validates, atomically increments sequence, writes document, and returns the saved Problem ID.
 */
export async function submitProblemToMongoDB(input: NewProblemInput): Promise<{ problemCode: string; problemId: string }> {
  const db = await getMongoDb();
  if (!db) {
    throw new Error('Unable to submit your problem right now. Database connection is not available.');
  }

  await ensureMongoIndexesAndBaseline();

  // Atomically generate the next sequential unique Problem ID
  const problemId = await getNextProblemIdAtomic(db);
  const now = new Date().toISOString();

  let city: string | null = null;
  let area: string | null = null;
  if (input.location) {
    const parts = input.location.split(',').map((s) => s.trim());
    city = parts[0] || null;
    if (parts[1]) area = parts[1];
  }

  const problemDoc = {
    id: crypto.randomUUID(),
    problemId,
    problem_code: problemId,
    title: input.raw_description.slice(0, 100),
    description: input.raw_description,
    raw_description: input.raw_description,
    normalized_problem: input.raw_description,
    category: input.category,
    category_name: input.category,
    category_id: null,
    subcategory: null,
    user_type: input.user_type,
    whoFacesThis: input.user_type,
    frequency: input.frequency,
    severity: 'Moderate',
    location: input.location || null,
    city,
    area,
    pincode: null,
    is_anonymous: true,
    ai_processed: true,
    status: 'active',
    submittedAt: now,
    created_at: now,
    updated_at: now,
    supports_count: 1,
    signal_score: 80,
  };

  const problemsCol = db.collection('problems');
  await problemsCol.insertOne(problemDoc);

  return { problemCode: problemId, problemId };
}

/**
 * Retrieves problems directly from MongoDB Atlas for the Admin Dashboard.
 */
export async function getProblemsFromMongoDB(filters?: {
  search?: string;
  category?: string;
  user_type?: string;
  frequency?: string;
  limit?: number;
}): Promise<Problem[]> {
  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB Atlas connection is not configured.');
  }

  await ensureMongoIndexesAndBaseline();
  const problemsCol = db.collection('problems');

  const query: Record<string, any> = { status: 'active' };

  if (filters?.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { raw_description: regex },
      { description: regex },
      { problem_code: regex },
      { problemId: regex },
      { city: regex },
    ];
  }

  if (filters?.category && filters.category !== 'All') {
    query.$or = [
      { category_name: filters.category },
      { category: filters.category },
    ];
  }

  if (filters?.user_type && filters.user_type !== 'All') {
    query.$or = [
      { user_type: filters.user_type },
      { whoFacesThis: filters.user_type },
    ];
  }

  if (filters?.frequency && filters.frequency !== 'All') {
    query.frequency = filters.frequency;
  }

  let cursor = problemsCol.find(query).sort({ created_at: -1 });

  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }

  const docs = await cursor.toArray();

  return docs.map((doc: any) => ({
    id: doc.id || String(doc._id),
    problem_code: doc.problem_code || doc.problemId,
    user_id: doc.user_id || null,
    submitter_name: doc.submitter_name || 'Community Member',
    raw_description: doc.raw_description || doc.description,
    normalized_problem: doc.normalized_problem || doc.raw_description,
    category_id: doc.category_id || null,
    category_name: doc.category_name || doc.category || 'General',
    subcategory: doc.subcategory || null,
    user_type: doc.user_type || doc.whoFacesThis || 'Everyone',
    frequency: doc.frequency || 'Daily',
    severity: doc.severity || 'Moderate',
    city: doc.city || null,
    area: doc.area || null,
    pincode: doc.pincode || null,
    location: doc.location || [doc.area, doc.city].filter(Boolean).join(', ') || null,
    is_anonymous: doc.is_anonymous !== false,
    ai_processed: true,
    status: 'active',
    created_at: doc.created_at || doc.submittedAt || new Date().toISOString(),
    updated_at: doc.updated_at || new Date().toISOString(),
    supports_count: doc.supports_count || 1,
    signal_score: doc.signal_score || 80,
  }));
}

/**
 * Computes exact real statistics directly from the MongoDB Atlas problems collection.
 */
export async function getMongoDatabaseStats(): Promise<{
  totalProblems: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  categoryDistribution: Record<string, number>;
  whoFacesDistribution: Record<string, number>;
  frequencyDistribution: Record<string, number>;
}> {
  const problems = await getProblemsFromMongoDB({ limit: 10000 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;

  const categoryDistribution: Record<string, number> = {};
  const whoFacesDistribution: Record<string, number> = {};
  const frequencyDistribution: Record<string, number> = {};

  for (const p of problems) {
    const pTime = new Date(p.created_at).getTime();
    if (!isNaN(pTime)) {
      if (pTime >= startOfToday) todayCount++;
      if (pTime >= sevenDaysAgo) weekCount++;
      if (pTime >= thirtyDaysAgo) monthCount++;
    }

    const cat = p.category_name || 'Other';
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

    const userType = p.user_type || 'Everyone';
    whoFacesDistribution[userType] = (whoFacesDistribution[userType] || 0) + 1;

    const freq = p.frequency || 'Daily';
    frequencyDistribution[freq] = (frequencyDistribution[freq] || 0) + 1;
  }

  return {
    totalProblems: problems.length,
    todayCount,
    weekCount,
    monthCount,
    categoryDistribution,
    whoFacesDistribution,
    frequencyDistribution,
  };
}

/**
 * Diagnostic utility for admin inspection of the live MongoDB Atlas connection
 */
export async function getMongoDiagnostic(): Promise<{
  hasMongoUri: boolean;
  connectionTest: string;
  databaseName: string;
  collectionsFound: string[];
  recordsCount: number;
  latestCodes: string[];
  counterValue: number | null;
  error: string | null;
}> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return {
      hasMongoUri: false,
      connectionTest: 'NO_MONGODB_URI_CONFIGURED',
      databaseName: 'none',
      collectionsFound: [],
      recordsCount: 0,
      latestCodes: [],
      counterValue: null,
      error: 'MONGODB_URI environment variable is missing on Vercel.',
    };
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      throw new Error('Failed to obtain MongoDB database handle from connection pool.');
    }

    await ensureMongoIndexesAndBaseline();

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    const problemsCol = db.collection('problems');
    const recordsCount = await problemsCol.countDocuments({ status: 'active' });

    const latestDocs = await problemsCol
      .find({ status: 'active' }, { projection: { problem_code: 1, problemId: 1 } })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    const latestCodes = latestDocs.map((d: any) => d.problem_code || d.problemId);

    const countersCol = db.collection('counters');
    const counterDoc = await countersCol.findOne({ _id: 'problemId' as any });

    return {
      hasMongoUri: true,
      connectionTest: 'SUCCESS',
      databaseName: db.databaseName,
      collectionsFound: collectionNames,
      recordsCount,
      latestCodes,
      counterValue: counterDoc ? counterDoc.seq : null,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      hasMongoUri: true,
      connectionTest: 'FAILED',
      databaseName: 'unknown',
      collectionsFound: [],
      recordsCount: 0,
      latestCodes: [],
      counterValue: null,
      error: msg,
    };
  }
}
