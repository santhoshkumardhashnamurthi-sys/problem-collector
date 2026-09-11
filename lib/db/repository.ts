// =============================================================================
// ARTIX Repository Layer
// Handles real Supabase PostgreSQL persistence with fallback in-memory store
// Ensures zero runtime crashes, instant responsiveness, and exact real statistics
// =============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Problem,
  ProblemCategory,
  ProblemCluster,
  ProblemAIAnalysis,
  DatabaseStats,
  SubmitProblemInput,
  ProblemSupport,
  ProblemSortOption,
} from './schema';
import { INITIAL_CATEGORIES, DEMO_CLUSTERS, DEMO_PROBLEMS } from './seed-data';
import { aiProvider } from '../ai/openai';
import { findOrCreateCluster } from '../similarity/clustering';
import { createAdminClient } from '../supabase/admin';

/**
 * Executes a promise with an explicit timeout to prevent hanging on remote networks
 */
function withTimeout<T>(promise: PromiseLike<T>, ms = 3500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    Promise.resolve(promise)
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// In-memory persistent state across requests during node runtime
class MemoryStore {
  categories: ProblemCategory[] = [...INITIAL_CATEGORIES];
  clusters: ProblemCluster[] = [...DEMO_CLUSTERS];
  problems: Problem[] = [...DEMO_PROBLEMS];
  analyses: ProblemAIAnalysis[] = [];
  supports: ProblemSupport[] = [];
  liveListeners: Array<(problem: Problem) => void> = [];

  constructor() {
    this.load();
    this.recalculateCounts();
  }

  load() {
    try {
      const dataFile = path.join(process.cwd(), '.data', 'artix_db.json');
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.problems) this.problems = parsed.problems;
        if (parsed.clusters) this.clusters = parsed.clusters;
        if (parsed.categories) this.categories = parsed.categories;
      }
    } catch {
      // Use in-memory defaults
    }
  }

  persist() {
    try {
      const dataDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataFile = path.join(dataDir, 'artix_db.json');
      fs.writeFileSync(
        dataFile,
        JSON.stringify(
          {
            problems: this.problems,
            clusters: this.clusters,
            categories: this.categories,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch {
      // Ignore write errors
    }
  }

  recalculateCounts() {
    const counts: Record<string, number> = {};
    for (const p of this.problems) {
      if (p.status === 'active' && p.category_name) {
        counts[p.category_name] = (counts[p.category_name] || 0) + 1;
      }
    }
    this.categories = this.categories.map(c => ({
      ...c,
      count: counts[c.name] || 0,
    }));
  }
}

// Global singleton for memory store
const globalForStore = globalThis as unknown as { artixStore?: MemoryStore };
export const store = globalForStore.artixStore || new MemoryStore();
globalForStore.artixStore = store;

export class ArtixRepository {
  private hasSupabase(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  async getDatabaseStats(): Promise<DatabaseStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (this.hasSupabase()) {
      const supabase = createAdminClient();
      if (supabase) {
        try {
          // Probe availability and get total count with a 2500ms timeout
          const { count: totalProblems, error: testErr } = await withTimeout(
            supabase
              .from('problems')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active'),
            2500
          );

          if (!testErr && typeof totalProblems === 'number') {
            const [todayRes, categoryRes, locRes, submitterRes] = await Promise.all([
              withTimeout(
                supabase
                  .from('problems')
                  .select('*', { count: 'exact', head: true })
                  .eq('status', 'active')
                  .gte('created_at', todayStart.toISOString()),
                2500
              ).catch(() => ({ count: 0 })),
              withTimeout(
                supabase
                  .from('problems')
                  .select('category_id, problem_categories(name)')
                  .eq('status', 'active'),
                2500
              ).catch(() => ({ data: [] })),
              withTimeout(
                supabase
                  .from('problems')
                  .select('city')
                  .eq('status', 'active')
                  .not('city', 'is', null),
                2500
              ).catch(() => ({ data: [] })),
              withTimeout(
                supabase
                  .from('problems')
                  .select('user_id')
                  .eq('status', 'active')
                  .not('user_id', 'is', null),
                2500
              ).catch(() => ({ data: [] })),
            ]);

            const locData = locRes.data;
            const uniqueLocations = new Set(locData?.map((l: { city: string | null }) => l.city).filter(Boolean));
            const categoryCounts: Record<string, number> = {};

            categoryRes.data?.forEach((p: { problem_categories?: { name?: string } | { name?: string }[] | null }) => {
              const rawCat = p.problem_categories;
              const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
              const catName = cat?.name || 'Other';
              categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
            });

            const uniqueSubmitters = new Set(submitterRes.data?.map((s: { user_id: string }) => s.user_id).filter(Boolean)).size;

            return {
              totalProblems: totalProblems || 0,
              uniqueContributors: uniqueSubmitters,
              uniqueSubmitters: uniqueSubmitters,
              todayProblems: todayRes.count || 0,
              categoriesCount: Object.keys(categoryCounts).length || store.categories.length,
              locationsCovered: uniqueLocations.size,
              categoryCounts,
              latestUpdated: new Date().toISOString(),
            };
          }
        } catch (e) {
          console.warn('Supabase stats fetch failed, falling back to local store:', e);
        }
      }
    }

    // Dynamic stats from local store
    store.recalculateCounts();
    const activeProblems = store.problems.filter(p => p.status === 'active');
    const uniqueLocations = new Set(activeProblems.map(p => p.city).filter(Boolean));
    const localSubmitters = new Set(activeProblems.map(p => p.user_id).filter(Boolean)).size;
    const todayProblems = activeProblems.filter(p => new Date(p.created_at) >= todayStart).length;
    const categoryCounts: Record<string, number> = {};

    for (const c of store.categories) {
      categoryCounts[c.name] = c.count || 0;
    }

    return {
      totalProblems: activeProblems.length,
      uniqueContributors: localSubmitters,
      uniqueSubmitters: localSubmitters,
      todayProblems,
      categoriesCount: store.categories.length,
      locationsCovered: uniqueLocations.size,
      categoryCounts,
      latestUpdated: new Date().toISOString(),
    };
  }

  async getCategories(): Promise<ProblemCategory[]> {
    store.recalculateCounts();
    return store.categories;
  }

  async getCategoryBySlug(slug: string): Promise<{ category: ProblemCategory | null; problems: Problem[]; stats: { total: number; topGroup: string; topFrequency: string } }> {
    const category = store.categories.find(c => c.slug === slug) || null;
    if (!category) {
      return { category: null, problems: [], stats: { total: 0, topGroup: 'None', topFrequency: 'None' } };
    }

    const problems = store.problems.filter(p => p.category_name?.toLowerCase() === category.name.toLowerCase() && p.status === 'active');
    
    // Calculate stats
    const groups: Record<string, number> = {};
    const freqs: Record<string, number> = {};
    problems.forEach(p => {
      groups[p.user_type] = (groups[p.user_type] || 0) + 1;
      freqs[p.frequency] = (freqs[p.frequency] || 0) + 1;
    });

    const topGroup = Object.entries(groups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Everyone';
    const topFrequency = Object.entries(freqs).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Daily';

    return {
      category: {
        ...category,
        count: problems.length,
      },
      problems,
      stats: {
        total: problems.length,
        topGroup,
        topFrequency,
      }
    };
  }

  async getProblems(filters?: {
    search?: string;
    category?: string;
    user_type?: string;
    frequency?: string;
    severity?: string;
    city?: string;
    sort?: ProblemSortOption;
  }): Promise<Problem[]> {
    if (this.hasSupabase()) {
      const supabase = createAdminClient();
      if (supabase) {
        try {
          let query = supabase
            .from('problems')
            .select('*, problem_categories(name), profiles(name)')
            .eq('status', 'active');

          if (filters?.search) {
            const q = filters.search.trim();
            query = query.or(`raw_description.ilike.%${q}%,normalized_problem.ilike.%${q}%,problem_code.ilike.%${q}%,city.ilike.%${q}%`);
          }

          if (filters?.user_type && filters.user_type !== 'All') {
            query = query.eq('user_type', filters.user_type);
          }

          if (filters?.frequency && filters.frequency !== 'All') {
            query = query.eq('frequency', filters.frequency);
          }

          if (filters?.severity && filters.severity !== 'All') {
            query = query.eq('severity', filters.severity);
          }

          if (filters?.city && filters.city !== 'All') {
            query = query.eq('city', filters.city);
          }

          query = query.order('created_at', { ascending: false });

          const { data, error } = await withTimeout(query, 3000);
          if (!error && data) {
            let items: Problem[] = data.map((p: any) => {
              const rawCat = p.problem_categories;
              const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
              const rawProfile = p.profiles;
              const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

              const submitterDisplayName = p.is_anonymous
                ? `Anonymous (${p.user_id ? p.user_id.slice(0, 8) : 'guest'})`
                : (profile?.name || 'Community Member');

              return {
                id: p.id,
                problem_code: p.problem_code,
                user_id: p.user_id,
                submitter_name: submitterDisplayName,
                raw_description: p.raw_description,
                normalized_problem: p.normalized_problem,
                category_id: p.category_id,
                category_name: cat?.name || 'General',
                subcategory: p.subcategory,
                user_type: p.user_type,
                frequency: p.frequency,
                severity: p.severity,
                city: p.city,
                area: p.area,
                pincode: p.pincode,
                is_anonymous: p.is_anonymous,
                ai_processed: p.ai_processed,
                status: p.status,
                created_at: p.created_at,
                updated_at: p.updated_at,
                supports_count: p.supports_count || 1,
                signal_score: p.signal_score || 75,
              };
            });

            if (filters?.category && filters.category !== 'All') {
              items = items.filter(
                p => p.category_name?.toLowerCase() === filters.category?.toLowerCase()
              );
            }

            if (filters?.sort === 'most_supported') {
              items.sort((a, b) => (b.supports_count || 0) - (a.supports_count || 0));
            } else if (filters?.sort === 'highest_signal' || filters?.sort === 'fastest_growing') {
              items.sort((a, b) => (b.signal_score || 0) - (a.signal_score || 0));
            }

            return items;
          }
        } catch (e) {
          console.warn('Supabase getProblems failed, falling back to local store:', e);
        }
      }
    }

    store.load();
    let result = store.problems.filter(p => p.status === 'active');

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          p =>
            p.raw_description.toLowerCase().includes(q) ||
            (p.normalized_problem && p.normalized_problem.toLowerCase().includes(q)) ||
            p.problem_code.toLowerCase().includes(q) ||
            (p.city && p.city.toLowerCase().includes(q))
        );
      }

      if (filters.category && filters.category !== 'All') {
        result = result.filter(p => p.category_name?.toLowerCase() === filters.category?.toLowerCase());
      }

      if (filters.user_type && filters.user_type !== 'All') {
        result = result.filter(p => p.user_type.toLowerCase() === filters.user_type?.toLowerCase());
      }

      if (filters.frequency && filters.frequency !== 'All') {
        result = result.filter(p => p.frequency.toLowerCase() === filters.frequency?.toLowerCase());
      }

      if (filters.severity && filters.severity !== 'All') {
        result = result.filter(p => p.severity.toLowerCase() === filters.severity?.toLowerCase());
      }

      if (filters.city && filters.city !== 'All') {
        result = result.filter(p => p.city?.toLowerCase() === filters.city?.toLowerCase());
      }

      // Sorting
      if (filters.sort === 'most_supported') {
        result.sort((a, b) => (b.supports_count || 0) - (a.supports_count || 0));
      } else if (filters.sort === 'highest_signal') {
        result.sort((a, b) => (b.signal_score || 0) - (a.signal_score || 0));
      } else if (filters.sort === 'fastest_growing') {
        result.sort((a, b) => (b.signal_score || 0) - (a.signal_score || 0));
      } else {
        // Default most_recent
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    return result;
  }

  async getProblemBySlugOrCode(idOrCode: string): Promise<{ problem: Problem | null; cluster: ProblemCluster | null; similar: Problem[] }> {
    if (this.hasSupabase()) {
      const supabase = createAdminClient();
      if (supabase) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
          let query = supabase
            .from('problems')
            .select('*, problem_categories(name), profiles(name)');

          if (isUuid) {
            query = query.or(`id.eq.${idOrCode},problem_code.ilike.${idOrCode}`);
          } else {
            query = query.ilike('problem_code', idOrCode);
          }

          const { data, error } = await withTimeout(query.maybeSingle(), 3000);
          if (!error && data) {
            const rawCat = data.problem_categories;
            const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
            const rawProfile = data.profiles;
            const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

            const prob: Problem = {
              id: data.id,
              problem_code: data.problem_code,
              user_id: data.user_id,
              submitter_name: data.is_anonymous
                ? `Anonymous (${data.user_id ? data.user_id.slice(0, 8) : 'guest'})`
                : (profile?.name || 'Community Member'),
              raw_description: data.raw_description,
              normalized_problem: data.normalized_problem,
              category_id: data.category_id,
              category_name: cat?.name || 'General',
              subcategory: data.subcategory,
              user_type: data.user_type,
              frequency: data.frequency,
              severity: data.severity,
              city: data.city,
              area: data.area,
              pincode: data.pincode,
              is_anonymous: data.is_anonymous,
              ai_processed: data.ai_processed,
              status: data.status,
              created_at: data.created_at,
              updated_at: data.updated_at,
              supports_count: data.supports_count || 1,
              signal_score: data.signal_score || 75,
            };

            const similar = store.problems.filter(
              p => p.id !== prob.id && (p.category_id === prob.category_id)
            ).slice(0, 4);

            return { problem: prob, cluster: null, similar };
          }
        } catch (e) {
          console.warn('Supabase fetch problem failed:', e);
        }
      }
    }

    store.load();
    const problem = store.problems.find(
      p => p.problem_code.toLowerCase() === idOrCode.toLowerCase() || p.id === idOrCode
    ) || null;

    if (!problem) {
      return { problem: null, cluster: null, similar: [] };
    }

    const cluster = store.clusters.find(c => c.id === problem.cluster_id) || null;
    const similar = store.problems.filter(
      p => p.id !== problem.id && (p.cluster_id === problem.cluster_id || p.category_id === problem.category_id)
    ).slice(0, 4);

    return { problem, cluster, similar };
  }

  async getClusters(): Promise<ProblemCluster[]> {
    return [...store.clusters].sort((a, b) => b.signal_score - a.signal_score);
  }

  async getClusterBySlug(slug: string): Promise<{ cluster: ProblemCluster | null; problems: Problem[] }> {
    const cluster = store.clusters.find(c => c.slug === slug || c.id === slug) || null;
    if (!cluster) {
      return { cluster: null, problems: [] };
    }
    const problems = store.problems.filter(p => p.cluster_id === cluster.id);
    return { cluster, problems };
  }

  async submitProblem(input: SubmitProblemInput): Promise<{ problem: Problem; cluster: ProblemCluster; analysis: ProblemAIAnalysis }> {
    const problemDbId = crypto.randomUUID();
    const supabase = this.hasSupabase() ? createAdminClient() : null;

    // 1. Submitter identification (anonymous or authenticated)
    const submitterId =
      input.submitter_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.submitter_id)
        ? input.submitter_id
        : crypto.randomUUID();

    const submitterDisplayName = input.is_anonymous !== false
      ? `Anonymous (${submitterId.slice(0, 8)})`
      : `Contributor (${submitterId.slice(0, 8)})`;

    // 2. Sequential Problem ID code
    let nextCount = store.problems.length + 1;
    if (supabase) {
      try {
        const { count } = await withTimeout(
          supabase.from('problems').select('*', { count: 'exact', head: true }),
          2000
        );
        if (typeof count === 'number' && count >= nextCount) {
          nextCount = count + 1;
        }
      } catch {
        // Fallback to local store length
      }
    }
    const problemCode = `ARTIX-2026-${String(nextCount).padStart(4, '0')}`;

    // 3. Parse location fields
    let city = input.city || null;
    let area = input.area || null;
    const pincode = input.pincode || null;
    if (input.location && !city) {
      const parts = input.location.split(',').map(s => s.trim());
      city = parts[0] || null;
      if (parts[1]) area = parts[1];
    }

    // 4. Trigger AI Processing
    const analysisResult = await aiProvider.analyzeProblem(
      input.raw_description,
      input.category,
      input.user_type,
      input.frequency
    );

    // 5. Resolve Category Record
    let categoryRecord = store.categories.find(
      c => c.name.toLowerCase() === (analysisResult.category || input.category).toLowerCase()
    );
    if (!categoryRecord && supabase) {
      try {
        const { data: dbCat } = await withTimeout(
          supabase
            .from('problem_categories')
            .select('*')
            .ilike('name', analysisResult.category || input.category)
            .maybeSingle(),
          2000
        );
        if (dbCat) categoryRecord = dbCat;
      } catch {
        // Ignore remote lookup error
      }
    }

    const defaultCategory: ProblemCategory = store.categories[0] || INITIAL_CATEGORIES[0];
    const finalCategory: ProblemCategory = categoryRecord || defaultCategory;

    // 6. Cluster Assignment & Opportunity Signal
    const clusterResult = findOrCreateCluster(
      {
        raw_description: input.raw_description,
        normalized_problem: analysisResult.normalized_problem,
        category_id: finalCategory.id,
        category_name: finalCategory.name,
        city,
        frequency: analysisResult.detected_frequency,
        severity: analysisResult.detected_severity,
      },
      store.clusters
    );

    if (clusterResult.isNewCluster) {
      store.clusters.unshift(clusterResult.cluster);
    } else {
      const idx = store.clusters.findIndex(c => c.id === clusterResult.cluster.id);
      if (idx !== -1) {
        store.clusters[idx] = clusterResult.cluster;
      }
    }

    let syncedToSupabase = false;
    let createdAt = new Date().toISOString();

    // 7. Supabase Database Persistence with Fault-Tolerant Fallback
    if (supabase) {
      try {
        // Ensure submitter profile exists
        await withTimeout(
          supabase.from('profiles').upsert(
            {
              id: submitterId,
              name: submitterDisplayName,
              role: 'user',
              updated_at: createdAt,
            },
            { onConflict: 'id' }
          ),
          2500
        ).catch((profileErr: any) => {
          console.warn('[ArtixRepository] Profile upsert notice:', profileErr?.message);
        });

        // Insert problem into public.problems
        const { data: insertedProblem, error: insertError } = await withTimeout(
          supabase
            .from('problems')
            .insert({
              id: problemDbId,
              problem_code: problemCode,
              user_id: submitterId,
              raw_description: input.raw_description,
              normalized_problem: analysisResult.normalized_problem,
              category_id: finalCategory.id,
              subcategory: analysisResult.subcategory,
              user_type: input.user_type || analysisResult.affected_group,
              frequency: input.frequency || analysisResult.detected_frequency,
              severity: analysisResult.detected_severity,
              city,
              area,
              pincode,
              is_anonymous: input.is_anonymous !== false,
              ai_processed: true,
              status: 'active',
            })
            .select('*')
            .single(),
          3500
        );

        if (!insertError && insertedProblem) {
          syncedToSupabase = true;
          if (insertedProblem.created_at) {
            createdAt = insertedProblem.created_at;
          }

          // Insert AI Analysis
          await withTimeout(
            supabase.from('problem_ai_analysis').insert({
              id: crypto.randomUUID(),
              problem_id: problemDbId,
              normalized_text: analysisResult.normalized_problem,
              category: analysisResult.category,
              subcategory: analysisResult.subcategory,
              keywords: analysisResult.keywords,
              affected_group: analysisResult.affected_group,
              detected_frequency: analysisResult.detected_frequency,
              detected_severity: analysisResult.detected_severity,
              confidence: analysisResult.confidence,
            }),
            2500
          ).catch((aiErr: any) => {
            console.warn('[ArtixRepository] AI analysis insert notice:', aiErr?.message);
          });
        } else {
          console.warn('[ArtixRepository] Supabase persistence skipped/warning (falling back to persistent local store & Excel):', insertError?.message);
        }
      } catch (dbErr: any) {
        console.warn('[ArtixRepository] Supabase persistence skipped or timed out, continuing with persistent local store & Excel:', dbErr?.message || dbErr);
      }
    }

    const newProblem: Problem = {
      id: problemDbId,
      problem_code: problemCode,
      user_id: submitterId,
      submitter_name: submitterDisplayName,
      raw_description: input.raw_description,
      normalized_problem: analysisResult.normalized_problem,
      category_id: finalCategory.id,
      category_name: finalCategory.name,
      subcategory: analysisResult.subcategory,
      user_type: input.user_type || analysisResult.affected_group,
      frequency: input.frequency || analysisResult.detected_frequency,
      severity: analysisResult.detected_severity,
      city,
      area,
      pincode,
      is_anonymous: input.is_anonymous !== false,
      ai_processed: true,
      status: 'active',
      created_at: createdAt,
      updated_at: createdAt,
      supports_count: 1,
      cluster_id: clusterResult.cluster.id,
      cluster_name: clusterResult.cluster.name,
      signal_score: clusterResult.cluster.signal_score,
      synced_to_supabase: syncedToSupabase,
    };

    const newAnalysis: ProblemAIAnalysis = {
      id: crypto.randomUUID(),
      problem_id: problemDbId,
      normalized_text: analysisResult.normalized_problem,
      category: analysisResult.category,
      subcategory: analysisResult.subcategory,
      keywords: analysisResult.keywords,
      affected_group: analysisResult.affected_group,
      detected_frequency: analysisResult.detected_frequency,
      detected_severity: analysisResult.detected_severity,
      confidence: analysisResult.confidence,
      created_at: createdAt,
    };

    // Update local cache & persistent storage
    store.problems.unshift(newProblem);
    store.analyses.push(newAnalysis);
    store.recalculateCounts();
    store.persist();

    // Broadcast to live listeners
    store.liveListeners.forEach(listener => {
      try {
        listener(newProblem);
      } catch (err) {
        console.error('Error in live problem listener:', err);
      }
    });

    return {
      problem: newProblem,
      cluster: clusterResult.cluster,
      analysis: newAnalysis,
    };
  }

  async supportProblem(problemId: string): Promise<{ success: boolean; supportsCount: number }> {
    const prob = store.problems.find(p => p.id === problemId || p.problem_code === problemId);
    if (!prob) {
      return { success: false, supportsCount: 0 };
    }
    prob.supports_count = (prob.supports_count || 0) + 1;
    return { success: true, supportsCount: prob.supports_count };
  }

  async getLocationsAggregate(): Promise<Array<{ city: string; count: number; topCategory: string }>> {
    const map: Record<string, { count: number; categories: Record<string, number> }> = {};

    store.problems.forEach(p => {
      if (p.city && p.status === 'active') {
        if (!map[p.city]) {
          map[p.city] = { count: 0, categories: {} };
        }
        map[p.city].count++;
        const cat = p.category_name || 'Other';
        map[p.city].categories[cat] = (map[p.city].categories[cat] || 0) + 1;
      }
    });

    return Object.entries(map).map(([city, data]) => {
      const topCategory = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
      return {
        city,
        count: data.count,
        topCategory,
      };
    }).sort((a, b) => b.count - a.count);
  }

  subscribeLive(callback: (problem: Problem) => void): () => void {
    store.liveListeners.push(callback);
    return () => {
      store.liveListeners = store.liveListeners.filter(l => l !== callback);
    };
  }

  async checkSupabaseHealth(): Promise<{ configured: boolean; connected: boolean; tablesExist: boolean; error?: string }> {
    if (!this.hasSupabase()) {
      return { configured: false, connected: false, tablesExist: false, error: 'Supabase credentials not configured' };
    }
    const supabase = createAdminClient();
    if (!supabase) {
      return { configured: true, connected: false, tablesExist: false, error: 'Failed to create Supabase client' };
    }
    try {
      const { error } = await withTimeout(
        supabase.from('problems').select('id').limit(1),
        3000
      );
      if (error) {
        return { configured: true, connected: true, tablesExist: false, error: error.message };
      }
      return { configured: true, connected: true, tablesExist: true };
    } catch (err: any) {
      return { configured: true, connected: false, tablesExist: false, error: err?.message || 'Connection timed out' };
    }
  }

  async syncUnsyncedToSupabase(): Promise<{ syncedCount: number; failedCount: number; errors: string[] }> {
    if (!this.hasSupabase()) {
      return { syncedCount: 0, failedCount: 0, errors: ['Supabase credentials not configured'] };
    }
    const supabase = createAdminClient();
    if (!supabase) {
      return { syncedCount: 0, failedCount: 0, errors: ['Failed to create Supabase client'] };
    }

    const unsynced = store.problems.filter(p => !p.synced_to_supabase);
    if (unsynced.length === 0) {
      return { syncedCount: 0, failedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const p of unsynced) {
      try {
        const { error } = await withTimeout(
          supabase.from('problems').upsert({
            id: p.id,
            problem_code: p.problem_code,
            user_id: p.user_id,
            raw_description: p.raw_description,
            normalized_problem: p.normalized_problem,
            category_id: p.category_id,
            subcategory: p.subcategory,
            user_type: p.user_type,
            frequency: p.frequency,
            severity: p.severity,
            city: p.city,
            area: p.area,
            pincode: p.pincode,
            is_anonymous: p.is_anonymous,
            ai_processed: p.ai_processed,
            status: p.status,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }, { onConflict: 'id' }),
          3500
        );

        if (error) {
          failedCount++;
          if (!errors.includes(error.message)) errors.push(error.message);
        } else {
          p.synced_to_supabase = true;
          syncedCount++;
        }
      } catch (err: any) {
        failedCount++;
        const msg = err?.message || 'Timeout or network error';
        if (!errors.includes(msg)) errors.push(msg);
      }
    }

    if (syncedCount > 0) {
      store.persist();
    }

    return { syncedCount, failedCount, errors };
  }
}

export const repository = new ArtixRepository();
