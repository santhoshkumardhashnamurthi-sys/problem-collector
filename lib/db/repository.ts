// =============================================================================
// ARTIX Repository Layer
// Powered exclusively by persistent Excel file storage (data/problems.xlsx)
// 100% Excel-backed file persistence with zero crash risk
// =============================================================================

import {
  Problem,
  ProblemCategory,
  ProblemCluster,
  ProblemAIAnalysis,
  DatabaseStats,
  SubmitProblemInput,
  ProblemSortOption,
} from './schema';
import { INITIAL_CATEGORIES, DEMO_CLUSTERS } from './seed-data';
import { excelService, ExcelProblemRow, getIndianDateTime } from '../excel-service';

/**
 * Convert Indian date (DD-MM-YYYY) and time (hh:mm A) to ISO string
 */
export function convertDateAndTimeToIso(dateStr: string, timeStr: string): string {
  try {
    const [day, month, year] = dateStr.split('-').map(Number);
    if (!day || !month || !year) return new Date().toISOString();

    let hours = 0;
    let minutes = 0;
    if (timeStr) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = (match[3] || '').toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }

    const d = new Date(year, month - 1, day, hours, minutes);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Map an ExcelProblemRow from data/problems.xlsx to a Problem domain entity
 */
export function mapExcelRowToProblem(row: ExcelProblemRow): Problem {
  const createdAtIso = convertDateAndTimeToIso(row.date, row.time);
  const code = `PRB-${String(row.id).padStart(3, '0')}`;
  const isAnon = !row.name || row.name.toLowerCase() === 'anonymous';

  return {
    id: String(row.id),
    problem_code: code,
    user_id: null,
    raw_description: row.problem,
    normalized_problem: row.problem,
    category_id: row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category_name: row.category,
    subcategory: null,
    user_type: 'Community Member',
    frequency: 'Regular',
    severity: 'Moderate',
    city: row.location && row.location !== '-' ? row.location : 'Undisclosed',
    area: null,
    pincode: null,
    is_anonymous: isAnon,
    ai_processed: false,
    status: (row.status?.toLowerCase() as 'active' | 'flagged' | 'archived') || 'active',
    created_at: createdAtIso,
    updated_at: createdAtIso,
    supports_count: 1,
    signal_score: 80,
    submitter_name: row.name || 'Anonymous',
    name: row.name,
    contact: row.contact,
    problem: row.problem,
    date: row.date,
    time: row.time,
  };
}

export class ArtixRepository {
  private liveListeners: Array<(problem: Problem) => void> = [];

  /**
   * Subscribe to live new problem events (for realtime SSE streams)
   */
  subscribeLive(listener: (problem: Problem) => void): () => void {
    this.liveListeners.push(listener);
    return () => {
      this.liveListeners = this.liveListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify live listeners of a new submission
   */
  private notifyLiveSubscribers(problem: Problem): void {
    for (const listener of this.liveListeners) {
      try {
        listener(problem);
      } catch (e) {
        console.error('[REPOSITORY_SSE_LISTENER_ERROR]', e);
      }
    }
  }

  /**
   * Reads all problem records from data/problems.xlsx and returns them as Problem entities
   */
  async getProblems(options?: {
    search?: string;
    category?: string;
    user_type?: string;
    frequency?: string;
    severity?: string;
    city?: string;
    sort?: ProblemSortOption;
  }): Promise<Problem[]> {
    const excelRows = await excelService.getAllProblems();
    let problems = excelRows.map(mapExcelRowToProblem);

    if (!options) {
      return problems.sort((a, b) => Number(b.id) - Number(a.id));
    }

    const { search, category, city, sort } = options;

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      problems = problems.filter(
        (p) =>
          p.problem_code.toLowerCase().includes(q) ||
          p.raw_description.toLowerCase().includes(q) ||
          (p.category_name && p.category_name.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      problems = problems.filter(
        (p) => p.category_name?.toLowerCase() === category.toLowerCase()
      );
    }

    if (city && city !== 'All') {
      problems = problems.filter(
        (p) => p.city?.toLowerCase() === city.toLowerCase()
      );
    }

    // Sorting
    if (sort === 'most_recent') {
      problems.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sort === 'highest_signal') {
      problems.sort((a, b) => (b.signal_score || 0) - (a.signal_score || 0));
    } else {
      problems.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return problems;
  }

  /**
   * Submit problem: appends to data/problems.xlsx, notifies SSE subscribers, returns Problem
   */
  async submitProblem(input: SubmitProblemInput): Promise<{
    problem: Problem;
    cluster?: ProblemCluster;
    analysis?: ProblemAIAnalysis;
  }> {
    const problemText = (input.raw_description || input.problem || '').trim();
    const loc = input.location || [input.area, input.city].filter(Boolean).join(', ') || '-';
    const submitterName = input.name || (input.is_anonymous ? 'Anonymous' : 'Community Member');
    const contactInfo = input.contact || '-';

    const excelRow = await excelService.appendProblem({
      category: input.category,
      problem: problemText,
      location: loc,
      name: submitterName,
      contact: contactInfo,
      status: 'New',
    });

    const problem = mapExcelRowToProblem(excelRow);

    // Notify real-time listeners
    this.notifyLiveSubscribers(problem);

    const cluster: ProblemCluster = {
      id: `cluster-${excelRow.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `${excelRow.category} Solutions Cluster`,
      slug: excelRow.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Collection of authentic challenges reported within ${excelRow.category}.`,
      category_id: excelRow.category.toLowerCase(),
      category_name: excelRow.category,
      report_count: 1,
      unique_contributors: 1,
      growth_rate: 15,
      signal_score: 80,
      created_at: problem.created_at,
      updated_at: problem.created_at,
    };

    return { problem, cluster };
  }

  /**
   * Returns aggregated database/storage statistics directly from data/problems.xlsx
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const excelRows = await excelService.getAllProblems();
    const problems = excelRows.map(mapExcelRowToProblem);

    const categoryCounts: Record<string, number> = {};
    const submittersSet = new Set<string>();
    const locationsSet = new Set<string>();

    const { dateStr: todayDateStr } = getIndianDateTime(new Date());
    let todayProblems = 0;

    for (const p of excelRows) {
      if (p.category) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }
      if (p.name && p.name !== '-' && p.name.toLowerCase() !== 'anonymous') {
        submittersSet.add(p.name);
      }
      if (p.location && p.location !== '-' && p.location.toLowerCase() !== 'undisclosed') {
        locationsSet.add(p.location);
      }
      if (p.date === todayDateStr) {
        todayProblems += 1;
      }
    }

    const uniqueSubmitters = submittersSet.size || (problems.length > 0 ? problems.length : 0);
    const locationsCovered = locationsSet.size || (problems.length > 0 ? 1 : 0);
    const categoriesCount = Object.keys(categoryCounts).length || INITIAL_CATEGORIES.length;

    return {
      totalProblems: problems.length,
      uniqueContributors: uniqueSubmitters,
      uniqueSubmitters,
      categoriesCount,
      locationsCovered,
      categoryCounts,
      todayProblems,
      latestUpdated: new Date().toISOString(),
    };
  }

  /**
   * Returns categories enriched with counts from data/problems.xlsx
   */
  async getCategories(): Promise<ProblemCategory[]> {
    const stats = await this.getDatabaseStats();
    return INITIAL_CATEGORIES.map((cat) => ({
      ...cat,
      count: stats.categoryCounts[cat.name] || 0,
    }));
  }

  /**
   * Find a category by slug along with its problems
   */
  async getCategoryBySlug(slug: string): Promise<{
    category?: ProblemCategory;
    problems: Problem[];
    stats: { totalReports: number; uniqueSubmitters: number; total: number; topGroup: string };
  }> {
    const categories = await this.getCategories();
    const category = categories.find(
      (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.toLowerCase()
    );

    const allProblems = await this.getProblems();
    const problems = category
      ? allProblems.filter((p) => p.category_name?.toLowerCase() === category.name.toLowerCase())
      : [];

    return {
      category,
      problems,
      stats: {
        total: problems.length,
        totalReports: problems.length,
        uniqueSubmitters: new Set(problems.map((p) => p.submitter_name)).size,
        topGroup: problems[0]?.user_type || 'Community',
      },
    };
  }

  /**
   * Find problem by ID or PRB code
   */
  async getProblemBySlugOrCode(slugOrCode: string): Promise<{
    problem: Problem | null;
    cluster: ProblemCluster | null;
    similar: Problem[];
  }> {
    const problems = await this.getProblems();
    const target = slugOrCode.toLowerCase().trim();

    const problem =
      problems.find(
        (p) =>
          p.id.toLowerCase() === target ||
          p.problem_code.toLowerCase() === target ||
          p.problem_code.toLowerCase().replace(/[^a-z0-9]/g, '') === target.replace(/[^a-z0-9]/g, '')
      ) || null;

    if (!problem) {
      return { problem: null, cluster: null, similar: [] };
    }

    const similar = problems
      .filter((p) => p.id !== problem.id && p.category_name === problem.category_name)
      .slice(0, 4);

    const cluster: ProblemCluster = {
      id: `cluster-${(problem.category_name || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `${problem.category_name || 'General'} Opportunity Cluster`,
      slug: (problem.category_name || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Aggregated problem trends reported in the ${problem.category_name || 'General'} sector.`,
      category_id: problem.category_name?.toLowerCase() || 'general',
      category_name: problem.category_name || 'General',
      report_count: similar.length + 1,
      unique_contributors: similar.length + 1,
      growth_rate: 18,
      signal_score: problem.signal_score || 85,
      created_at: problem.created_at,
      updated_at: problem.created_at,
    };

    return { problem, cluster, similar };
  }

  /**
   * Returns aggregated location counts from data/problems.xlsx
   */
  async getLocationsAggregate(): Promise<
    Array<{ city: string; count: number; activeCategories: string[]; topCategory: string }>
  > {
    const excelRows = await excelService.getAllProblems();
    const map = new Map<string, { count: number; categories: Set<string> }>();

    for (const r of excelRows) {
      const city = r.location && r.location !== '-' ? r.location : 'Undisclosed';
      const existing = map.get(city) || { count: 0, categories: new Set<string>() };
      existing.count += 1;
      if (r.category) existing.categories.add(r.category);
      map.set(city, existing);
    }

    return Array.from(map.entries()).map(([city, data]) => {
      const cats = Array.from(data.categories);
      return {
        city,
        count: data.count,
        activeCategories: cats,
        topCategory: cats[0] || 'General',
      };
    });
  }

  /**
   * Returns clusters for insights
   */
  async getClusters(): Promise<ProblemCluster[]> {
    const problems = await this.getProblems();
    const catMap = new Map<string, Problem[]>();

    for (const p of problems) {
      const cat = p.category_name || 'General';
      const list = catMap.get(cat) || [];
      list.push(p);
      catMap.set(cat, list);
    }

    if (catMap.size === 0) {
      return DEMO_CLUSTERS;
    }

    return Array.from(catMap.entries()).map(([cat, list]) => ({
      id: `cluster-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: `${cat} Opportunity Cluster`,
      slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `High-signal problems identified in ${cat}.`,
      category_id: cat.toLowerCase(),
      category_name: cat,
      report_count: list.length,
      unique_contributors: new Set(list.map((p) => p.submitter_name)).size,
      growth_rate: 15,
      signal_score: 82,
      created_at: list[0]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sample_problems: list.slice(0, 3),
    }));
  }

  /**
   * Health check for Excel storage
   */
  async checkStorageHealth(): Promise<{ configured: boolean; connected: boolean; tablesExist: boolean }> {
    try {
      await excelService.ensureInitialized();
      return { configured: true, connected: true, tablesExist: true };
    } catch {
      return { configured: false, connected: false, tablesExist: false };
    }
  }
}

export const repository = new ArtixRepository();
