// =============================================================================
// ARTIX Database Type Definitions
// Platform: ARTIX Problem Collection Platform
// Brand: CodeArtix | Founder: Santhoshkumar
// =============================================================================

export type UserRole = 'user' | 'admin' | 'researcher';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ProblemCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  created_at: string;
  count?: number; // dynamic count
}

export type ProblemSortOption =
  | 'most_reported'
  | 'fastest_growing'
  | 'most_recent'
  | 'highest_signal'
  | 'most_supported';

export interface Problem {
  id: string;
  problem_code: string;
  user_id: string | null;
  raw_description: string;
  normalized_problem: string | null;
  category_id: string | null;
  category_name?: string;
  subcategory: string | null;
  user_type: string;
  frequency: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  city: string | null;
  area: string | null;
  pincode: string | null;
  is_anonymous: boolean;
  ai_processed: boolean;
  status: 'active' | 'flagged' | 'archived' | 'merged';
  created_at: string;
  updated_at: string;
  supports_count?: number;
  cluster_id?: string | null;
  cluster_name?: string | null;
  signal_score?: number;
  submitter_name?: string;
  synced_to_supabase?: boolean;
}

export interface ProblemAIAnalysis {
  id: string;
  problem_id: string;
  normalized_text: string;
  category: string;
  subcategory: string;
  keywords: string[];
  affected_group: string;
  detected_frequency: string;
  detected_severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  confidence: number;
  created_at: string;
}

export interface ProblemCluster {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  category_name?: string;
  report_count: number;
  unique_contributors: number;
  growth_rate: number;
  signal_score: number;
  created_at: string;
  updated_at: string;
  top_locations?: string[];
  sample_problems?: Problem[];
}

export interface ProblemClusterMember {
  id: string;
  cluster_id: string;
  problem_id: string;
  similarity_score: number;
  created_at: string;
}

export interface ProblemSimilarity {
  id: string;
  problem_id: string;
  similar_problem_id: string;
  similarity_score: number;
  created_at: string;
}

export interface ProblemLocation {
  id: string;
  problem_id: string;
  city: string | null;
  area: string | null;
  pincode: string | null;
  created_at: string;
}

export interface ProblemSupport {
  id: string;
  problem_id: string;
  user_id: string | null;
  created_at: string;
}

export interface SavedInsight {
  id: string;
  user_id: string;
  cluster_id: string;
  title: string;
  created_at: string;
  cluster?: ProblemCluster;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DatabaseStats {
  totalProblems: number;
  uniqueContributors: number;
  categoriesCount: number;
  locationsCovered: number;
  categoryCounts: Record<string, number>;
  latestUpdated: string;
  todayProblems?: number;
  uniqueSubmitters?: number;
}

export interface SubmitProblemInput {
  raw_description: string;
  category: string;
  user_type: string;
  frequency: string;
  location?: string;
  city?: string;
  area?: string;
  pincode?: string;
  is_anonymous?: boolean;
  submitter_id?: string;
}
