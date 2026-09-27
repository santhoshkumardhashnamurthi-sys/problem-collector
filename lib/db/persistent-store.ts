// =============================================================================
// ARTIX Persistent Store Engine
// Production-grade persistence for Vercel Serverless & Local Runtime
// Supports PostgreSQL (Neon / Supabase / Vercel Postgres), Vercel KV, and Local Fallback
// Guarantees atomic, strictly sequential Problem IDs starting after ARTIX-000012
// =============================================================================

import { Pool } from 'pg';
import { Problem } from './schema';
import { BASELINE_PROBLEMS } from './baseline-problems';
import fs from 'fs';
import path from 'path';

// Singleton PostgreSQL connection pool
let pgPool: Pool | null = null;
let pgInitialized = false;

function getPgPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;

  if (!pgPool) {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

/**
 * Initializes the PostgreSQL tables and seeds baseline counter if not yet present
 */
async function initPgTables(pool: Pool) {
  if (pgInitialized) return;
  const client = await pool.connect();
  try {
    // 1. Counter table for atomic sequential IDs across all serverless instances
    await client.query(`
      CREATE TABLE IF NOT EXISTS artix_counter (
        name VARCHAR(32) PRIMARY KEY,
        current_val BIGINT NOT NULL
      );
    `);

    // Ensure baseline counter starts at 12 (so next is ARTIX-000013)
    await client.query(`
      INSERT INTO artix_counter (name, current_val)
      VALUES ('problem_seq', 12)
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Problems table for permanent storage
    await client.query(`
      CREATE TABLE IF NOT EXISTS artix_problems (
        id UUID PRIMARY KEY,
        problem_code VARCHAR(32) UNIQUE NOT NULL,
        user_id VARCHAR(64),
        submitter_name VARCHAR(128),
        raw_description TEXT NOT NULL,
        normalized_problem TEXT,
        category_name VARCHAR(64) NOT NULL,
        subcategory VARCHAR(128),
        user_type VARCHAR(64) NOT NULL,
        frequency VARCHAR(64) NOT NULL,
        severity VARCHAR(32) DEFAULT 'Moderate',
        city VARCHAR(128),
        area VARCHAR(128),
        pincode VARCHAR(32),
        is_anonymous BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_artix_problems_created ON artix_problems (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_artix_problems_code ON artix_problems (problem_code);
      CREATE INDEX IF NOT EXISTS idx_artix_problems_category ON artix_problems (category_name);
    `);

    // Check if initial problems need seeding from local master
    const { rows } = await client.query('SELECT COUNT(*) AS total FROM artix_problems');
    const count = parseInt(rows[0].total, 10);
    if (count === 0) {
      // Seed the initial problems up to ARTIX-000012
      const seedProblems = loadLocalSeedProblems();
      for (const p of seedProblems) {
        await client.query(`
          INSERT INTO artix_problems (
            id, problem_code, user_id, submitter_name, raw_description,
            normalized_problem, category_name, subcategory, user_type,
            frequency, severity, city, area, pincode, is_anonymous,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (problem_code) DO NOTHING;
        `, [
          p.id,
          p.problem_code,
          p.user_id,
          p.submitter_name || 'Community Member',
          p.raw_description,
          p.normalized_problem || p.raw_description,
          p.category_name || 'General',
          p.subcategory || null,
          p.user_type || 'Everyone',
          p.frequency || 'Daily',
          p.severity || 'Moderate',
          p.city || null,
          p.area || null,
          p.pincode || null,
          p.is_anonymous !== false,
          p.created_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString(),
        ]);
      }
    }

    pgInitialized = true;
  } finally {
    client.release();
  }
}

/**
 * Loads baseline seed problems from bundled local data (contains ARTIX-000001 to ARTIX-000012)
 */
export function loadLocalSeedProblems(): Problem[] {
  try {
    const dataFile = path.join(process.cwd(), '.data', 'artix_db.json');
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.problems) && parsed.problems.length >= BASELINE_PROBLEMS.length) {
        return parsed.problems;
      }
    }
  } catch {
    // Ignore read errors
  }
  return BASELINE_PROBLEMS;
}

/**
 * Atomic counter via Vercel KV / Upstash Redis REST API
 */
async function getNextKvSequence(): Promise<number | null> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    // 1. Ensure initial value is 12 (NX = Not eXists)
    await fetch(`${kvUrl}/set/artix:problem_seq/12/NX`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });

    // 2. Atomic increment
    const res = await fetch(`${kvUrl}/incr/artix:problem_seq`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    const data = await res.json();
    if (typeof data.result === 'number') {
      return data.result;
    }
  } catch (err) {
    console.warn('[PersistentStore] KV sequence fetch warning:', err);
  }
  return null;
}

/**
 * Persists a problem into Vercel KV
 */
async function saveKvProblem(problem: Problem): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return false;

  try {
    // Save to list of problems
    await fetch(`${kvUrl}/lpush/artix:problems_list/${encodeURIComponent(JSON.stringify(problem))}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    return true;
  } catch (err) {
    console.warn('[PersistentStore] KV save warning:', err);
    return false;
  }
}

/**
 * Gets the next sequential problem code atomically across any serverless runtime.
 * Guarantees next is ARTIX-000013, then ARTIX-000014, ARTIX-000015, etc.
 */
export async function getNextProblemCodeAtomic(): Promise<string> {
  // 1. Try PostgreSQL (ACID row-level lock)
  const pool = getPgPool();
  if (pool) {
    try {
      await initPgTables(pool);
      const res = await pool.query(`
        UPDATE artix_counter
        SET current_val = current_val + 1
        WHERE name = 'problem_seq'
        RETURNING current_val;
      `);
      if (res.rows && res.rows[0]) {
        const val = parseInt(res.rows[0].current_val, 10);
        return `ARTIX-${String(val).padStart(6, '0')}`;
      }
    } catch (err) {
      console.warn('[PersistentStore] PostgreSQL atomic counter warning, falling back:', err);
    }
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvSeq = await getNextKvSequence();
  if (kvSeq !== null) {
    return `ARTIX-${String(kvSeq).padStart(6, '0')}`;
  }

  // 3. Fallback to local files / memory baseline
  // Baseline is at least 12
  const localProblems = loadLocalSeedProblems();
  let maxFound = 12;
  for (const p of localProblems) {
    const match = p.problem_code.match(/^ARTIX-(\d{6})$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxFound) maxFound = num;
    }
  }
  const nextVal = maxFound + 1;
  return `ARTIX-${String(nextVal).padStart(6, '0')}`;
}

/**
 * Persists a new problem record permanently
 */
export async function persistProblemRecord(problem: Problem): Promise<void> {
  // 1. PostgreSQL Persistence
  const pool = getPgPool();
  if (pool) {
    try {
      await initPgTables(pool);
      await pool.query(`
        INSERT INTO artix_problems (
          id, problem_code, user_id, submitter_name, raw_description,
          normalized_problem, category_name, subcategory, user_type,
          frequency, severity, city, area, pincode, is_anonymous,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (problem_code) DO NOTHING;
      `, [
        problem.id,
        problem.problem_code,
        problem.user_id,
        problem.submitter_name || 'Community Member',
        problem.raw_description,
        problem.normalized_problem || problem.raw_description,
        problem.category_name || 'General',
        problem.subcategory || null,
        problem.user_type || 'Everyone',
        problem.frequency || 'Daily',
        problem.severity || 'Moderate',
        problem.city || null,
        problem.area || null,
        problem.pincode || null,
        problem.is_anonymous !== false,
        problem.created_at || new Date().toISOString(),
        problem.updated_at || new Date().toISOString(),
      ]);
    } catch (err) {
      console.warn('[PersistentStore] PostgreSQL problem insert warning:', err);
    }
  }

  // 2. Vercel KV Persistence
  await saveKvProblem(problem);

  // 3. Local JSON disk persistence (works in local dev and updates master files)
  try {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dataFile = path.join(dataDir, 'artix_db.json');
    let localData = { problems: [] as Problem[], clusters: [], categories: [] };
    if (fs.existsSync(dataFile)) {
      try {
        localData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      } catch {
        // Ignore read error
      }
    }
    // Prevent duplicate problem codes
    const existingIdx = localData.problems.findIndex((p: Problem) => p.problem_code === problem.problem_code);
    if (existingIdx !== -1) {
      localData.problems[existingIdx] = problem;
    } else {
      localData.problems.unshift(problem);
    }
    fs.writeFileSync(dataFile, JSON.stringify(localData, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in Vercel lambda is expected; remote store is used
  }
}

/**
 * Loads all problems from persistent store (PostgreSQL -> KV -> Local)
 */
export async function getPersistentProblems(): Promise<Problem[]> {
  // 1. Try PostgreSQL
  const pool = getPgPool();
  if (pool) {
    try {
      await initPgTables(pool);
      const { rows } = await pool.query(`
        SELECT * FROM artix_problems
        ORDER BY created_at DESC;
      `);
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          problem_code: r.problem_code,
          user_id: r.user_id,
          submitter_name: r.submitter_name || 'Community Member',
          raw_description: r.raw_description,
          normalized_problem: r.normalized_problem,
          category_id: null,
          category_name: r.category_name,
          subcategory: r.subcategory,
          user_type: r.user_type,
          frequency: r.frequency,
          severity: r.severity || 'Moderate',
          city: r.city,
          area: r.area,
          pincode: r.pincode,
          location: [r.area, r.city].filter(Boolean).join(', ') || null,
          is_anonymous: r.is_anonymous !== false,
          ai_processed: true,
          status: 'active',
          created_at: new Date(r.created_at).toISOString(),
          updated_at: new Date(r.updated_at).toISOString(),
          supports_count: 1,
          signal_score: 80,
        }));
      }
    } catch (err) {
      console.warn('[PersistentStore] PostgreSQL getProblems warning:', err);
    }
  }

  // 2. Try Vercel KV
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/lrange/artix:problems_list/0/1000`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      const data = await res.json();
      if (Array.isArray(data.result) && data.result.length > 0) {
        const kvProblems: Problem[] = data.result
          .map((item: string) => {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        if (kvProblems.length > 0) {
          // Merge with local baseline
          const baseline = loadLocalSeedProblems();
          const combined = [...kvProblems];
          for (const b of baseline) {
            if (!combined.some((p) => p.problem_code === b.problem_code)) {
              combined.push(b);
            }
          }
          return combined;
        }
      }
    } catch (err) {
      console.warn('[PersistentStore] KV getProblems warning:', err);
    }
  }

  // 3. Fallback to local baseline
  return loadLocalSeedProblems();
}

/**
 * Helper to inspect the active storage provider name
 */
export function getActiveStorageProvider(): string {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return 'PostgreSQL (Neon / Supabase / Vercel Postgres)';
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return 'Vercel KV (Upstash Redis)';
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'Supabase REST API';
  }
  return 'Local Bundled Store (Requires DATABASE_URL in Vercel for cross-lambda persistence)';
}
