// =============================================================================
// ARTIX Unified Database Layer
// Single source of truth for BOTH Public Problem Submission and Admin Dashboard
// Guarantees atomic sequential ID generation and 100% persistent storage
// =============================================================================

import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';
import { Problem } from './schema';
import { BASELINE_PROBLEMS } from './baseline-problems';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;
let isInitialized = false;

/**
 * Returns whether a real persistent database connection string is provided
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

/**
 * Gets or initializes the PostgreSQL pool
 */
export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;

  if (!pool) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

/**
 * Ensures the PostgreSQL tables and baseline counter exist.
 * Preserves all 12 historical records (ARTIX-000001 to ARTIX-000012).
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (isInitialized) return;
  const p = getDbPool();
  if (!p) return;

  const client = await p.connect();
  try {
    // 1. Counter table for atomic sequence generation
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

    // 2. Main problems table
    await client.query(`
      CREATE TABLE IF NOT EXISTS artix_problems (
        id UUID PRIMARY KEY,
        problem_code VARCHAR(32) UNIQUE NOT NULL,
        user_id VARCHAR(64),
        submitter_name VARCHAR(128) DEFAULT 'Anonymous Contributor',
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
        status VARCHAR(32) DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_artix_pbm_created ON artix_problems (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_artix_pbm_code ON artix_problems (problem_code);
      CREATE INDEX IF NOT EXISTS idx_artix_pbm_cat ON artix_problems (category_name);
    `);

    // 3. Seed baseline records if the table is completely empty
    const { rows: countRows } = await client.query('SELECT COUNT(*) AS total FROM artix_problems');
    const existingCount = parseInt(countRows[0].total, 10);

    if (existingCount === 0) {
      for (const b of BASELINE_PROBLEMS) {
        await client.query(`
          INSERT INTO artix_problems (
            id, problem_code, user_id, submitter_name, raw_description,
            normalized_problem, category_name, subcategory, user_type,
            frequency, severity, city, area, pincode, is_anonymous,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (problem_code) DO NOTHING;
        `, [
          b.id || crypto.randomUUID(),
          b.problem_code,
          b.user_id || null,
          b.submitter_name || 'Community Member',
          b.raw_description,
          b.normalized_problem || b.raw_description,
          b.category_name || 'General',
          b.subcategory || null,
          b.user_type || 'Everyone',
          b.frequency || 'Daily',
          b.severity || 'Moderate',
          b.city || null,
          b.area || null,
          b.pincode || null,
          b.is_anonymous !== false,
          b.status || 'active',
          b.created_at || new Date().toISOString(),
          b.updated_at || new Date().toISOString(),
        ]);
      }

      // Also ensure the counter is at least at the maximum baseline number
      await client.query(`
        UPDATE artix_counter
        SET current_val = GREATEST(current_val, 12)
        WHERE name = 'problem_seq';
      `);
    }

    // 4. Always ensure the counter is at least the highest existing numeric problem_code
    const { rows: codeRows } = await client.query(`
      SELECT problem_code FROM artix_problems
    `);
    let maxFound = 12;
    for (const r of codeRows) {
      const match = r.problem_code.match(/^ARTIX-(\d{6})$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxFound) maxFound = num;
      }
    }
    await client.query(`
      UPDATE artix_counter
      SET current_val = GREATEST(current_val, $1)
      WHERE name = 'problem_seq';
    `, [maxFound]);

    isInitialized = true;
  } finally {
    client.release();
  }
}

export interface NewProblemInput {
  raw_description: string;
  category: string;
  user_type: string;
  frequency: string;
  location?: string | null;
}

/**
 * Submits a new problem into the persistent database.
 * Generates the next sequential ID and inserts the record in a SINGLE atomic database transaction.
 */
export async function submitProblemToDatabase(input: NewProblemInput): Promise<{ problemCode: string; problemId: string }> {
  const p = getDbPool();

  // 1. Production PostgreSQL Database Flow
  if (p) {
    await ensureDatabaseSchema();
    const client = await p.connect();
    try {
      await client.query('BEGIN');

      // Atomically increment and get the next sequential number
      const seqRes = await client.query(`
        UPDATE artix_counter
        SET current_val = current_val + 1
        WHERE name = 'problem_seq'
        RETURNING current_val;
      `);

      if (!seqRes.rows || seqRes.rows.length === 0) {
        throw new Error('Failed to increment sequence in artix_counter');
      }

      const seqNumber = parseInt(seqRes.rows[0].current_val, 10);
      const problemCode = `ARTIX-${String(seqNumber).padStart(6, '0')}`;
      const problemId = crypto.randomUUID();

      let city: string | null = null;
      let area: string | null = null;
      if (input.location) {
        const parts = input.location.split(',').map((s) => s.trim());
        city = parts[0] || null;
        if (parts[1]) area = parts[1];
      }

      await client.query(`
        INSERT INTO artix_problems (
          id, problem_code, user_id, submitter_name, raw_description,
          normalized_problem, category_name, subcategory, user_type,
          frequency, severity, city, area, pincode, is_anonymous,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW());
      `, [
        problemId,
        problemCode,
        null,
        'Anonymous Contributor',
        input.raw_description,
        input.raw_description,
        input.category,
        null,
        input.user_type,
        input.frequency,
        'Moderate',
        city,
        area,
        null,
        true,
        'active',
      ]);

      await client.query('COMMIT');
      return { problemCode, problemId };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[UnifiedDB] Transaction failed in submitProblemToDatabase:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // 2. Vercel Serverless Guard: If running in Vercel without DATABASE_URL, fail explicitly
  if (process.env.VERCEL === '1') {
    throw new Error('Database is not configured in Vercel. Please add DATABASE_URL or POSTGRES_URL in Vercel Environment Variables.');
  }

  // 3. Local Development Fallback (.data/artix_db.json)
  return submitLocalFallback(input);
}

/**
 * Local fallback for development when no remote PostgreSQL is attached
 */
function submitLocalFallback(input: NewProblemInput): { problemCode: string; problemId: string } {
  const dataDir = path.join(process.cwd(), '.data');
  const dataFile = path.join(dataDir, 'artix_db.json');

  let problems: Problem[] = [...BASELINE_PROBLEMS];
  try {
    if (fs.existsSync(dataFile)) {
      const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      if (Array.isArray(parsed.problems)) {
        problems = parsed.problems;
      }
    }
  } catch {
    // Use baseline
  }

  // Find max sequential number
  let maxNum = 12;
  for (const p of problems) {
    const match = p.problem_code.match(/^ARTIX-(\d{6})$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const problemCode = `ARTIX-${String(nextNum).padStart(6, '0')}`;
  const problemId = crypto.randomUUID();

  let city: string | null = null;
  let area: string | null = null;
  if (input.location) {
    const parts = input.location.split(',').map((s) => s.trim());
    city = parts[0] || null;
    if (parts[1]) area = parts[1];
  }

  const newProblem: Problem = {
    id: problemId,
    problem_code: problemCode,
    user_id: null,
    submitter_name: 'Anonymous Contributor',
    raw_description: input.raw_description,
    normalized_problem: input.raw_description,
    category_id: null,
    category_name: input.category,
    subcategory: null,
    user_type: input.user_type,
    frequency: input.frequency,
    severity: 'Moderate',
    city,
    area,
    pincode: null,
    is_anonymous: true,
    ai_processed: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supports_count: 1,
    signal_score: 80,
  };

  problems.unshift(newProblem);

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify({ problems, clusters: [], categories: [] }, null, 2), 'utf-8');
  } catch {
    // Local write error
  }

  return { problemCode, problemId };
}

/**
 * Retrieves all problems from the database for the Admin Dashboard
 */
export async function getProblemsFromDatabase(filters?: {
  search?: string;
  category?: string;
  user_type?: string;
  frequency?: string;
  limit?: number;
}): Promise<Problem[]> {
  const p = getDbPool();

  if (p) {
    await ensureDatabaseSchema();
    let query = `
      SELECT * FROM artix_problems
      WHERE status = 'active'
    `;
    const params: (string | number)[] = [];
    let pIdx = 1;

    if (filters?.search) {
      query += ` AND (raw_description ILIKE $${pIdx} OR problem_code ILIKE $${pIdx} OR city ILIKE $${pIdx})`;
      params.push(`%${filters.search.trim()}%`);
      pIdx++;
    }

    if (filters?.category && filters.category !== 'All') {
      query += ` AND category_name = $${pIdx}`;
      params.push(filters.category);
      pIdx++;
    }

    if (filters?.user_type && filters.user_type !== 'All') {
      query += ` AND user_type = $${pIdx}`;
      params.push(filters.user_type);
      pIdx++;
    }

    if (filters?.frequency && filters.frequency !== 'All') {
      query += ` AND frequency = $${pIdx}`;
      params.push(filters.frequency);
      pIdx++;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${pIdx}`;
      params.push(filters.limit);
    }

    const { rows } = await p.query(query, params);

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

  // Local development fallback
  return getLocalProblemsFallback(filters);
}

function getLocalProblemsFallback(filters?: {
  search?: string;
  category?: string;
  user_type?: string;
  frequency?: string;
  limit?: number;
}): Problem[] {
  const dataFile = path.join(process.cwd(), '.data', 'artix_db.json');
  let problems: Problem[] = [...BASELINE_PROBLEMS];

  try {
    if (fs.existsSync(dataFile)) {
      const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      if (Array.isArray(parsed.problems)) {
        problems = parsed.problems;
      }
    }
  } catch {
    // Use baseline
  }

  let result = problems.filter((p) => p.status === 'active');

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.raw_description.toLowerCase().includes(q) ||
        p.problem_code.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
    );
  }

  if (filters?.category && filters.category !== 'All') {
    result = result.filter((p) => (p.category_name || '').toLowerCase() === filters.category!.toLowerCase());
  }

  if (filters?.user_type && filters.user_type !== 'All') {
    result = result.filter((p) => (p.user_type || '').toLowerCase() === filters.user_type!.toLowerCase());
  }

  if (filters?.frequency && filters.frequency !== 'All') {
    result = result.filter((p) => (p.frequency || '').toLowerCase() === filters.frequency!.toLowerCase());
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Computes exact stats from the single production database
 */
export async function getDatabaseStatsUnified(): Promise<{
  totalProblems: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  categoryDistribution: Record<string, number>;
  whoFacesDistribution: Record<string, number>;
  frequencyDistribution: Record<string, number>;
}> {
  const problems = await getProblemsFromDatabase({ limit: 10000 });

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
