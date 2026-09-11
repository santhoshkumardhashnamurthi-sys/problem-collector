-- =============================================================================
-- ARTIX Database Schema (Supabase PostgreSQL)
-- Platform: ARTIX Problem Collection Platform
-- Brand: CodeArtix | Founder: Santhoshkumar
-- =============================================================================

-- Enable pgvector if available (for vector embeddings)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'researcher')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Problem Categories Table
CREATE TABLE IF NOT EXISTS public.problem_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Problems Table
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_code TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    raw_description TEXT NOT NULL,
    normalized_problem TEXT,
    category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
    subcategory TEXT,
    user_type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    severity TEXT DEFAULT 'Moderate',
    city TEXT,
    area TEXT,
    pincode TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    ai_processed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'archived', 'merged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Problem AI Analysis Table
CREATE TABLE IF NOT EXISTS public.problem_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    normalized_text TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_group TEXT,
    detected_frequency TEXT,
    detected_severity TEXT,
    confidence NUMERIC NOT NULL DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Problem Clusters Table
CREATE TABLE IF NOT EXISTS public.problem_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
    report_count INTEGER NOT NULL DEFAULT 1,
    unique_contributors INTEGER NOT NULL DEFAULT 1,
    growth_rate NUMERIC NOT NULL DEFAULT 0,
    signal_score INTEGER NOT NULL DEFAULT 50 CHECK (signal_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Problem Cluster Members Table
CREATE TABLE IF NOT EXISTS public.problem_cluster_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES public.problem_clusters(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    similarity_score NUMERIC NOT NULL DEFAULT 0.9,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(cluster_id, problem_id)
);

-- 7. Problem Similarities Table
CREATE TABLE IF NOT EXISTS public.problem_similarities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    similar_problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    similarity_score NUMERIC NOT NULL DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(problem_id, similar_problem_id)
);

-- 8. Problem Locations Table
CREATE TABLE IF NOT EXISTS public.problem_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    city TEXT,
    area TEXT,
    pincode TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Daily Aggregations Table
CREATE TABLE IF NOT EXISTS public.problem_reports_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.problem_clusters(id) ON DELETE SET NULL,
    report_count INTEGER NOT NULL DEFAULT 1,
    unique_contributors INTEGER NOT NULL DEFAULT 1,
    UNIQUE(report_date, category_id, cluster_id)
);

-- 10. Problem Supports (Community endorsement)
CREATE TABLE IF NOT EXISTS public.problem_supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(problem_id, user_id)
);

-- 11. Saved Insights Table
CREATE TABLE IF NOT EXISTS public.saved_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cluster_id UUID NOT NULL REFERENCES public.problem_clusters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING & SEARCH
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_problems_code ON public.problems(problem_code);
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems(category_id);
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_created ON public.problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_city ON public.problems(city);
CREATE INDEX IF NOT EXISTS idx_problems_user_type ON public.problems(user_type);
CREATE INDEX IF NOT EXISTS idx_clusters_signal ON public.problem_clusters(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON public.problem_clusters(category_id);
CREATE INDEX IF NOT EXISTS idx_cluster_members ON public.problem_cluster_members(cluster_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_problem ON public.problem_ai_analysis(problem_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view and insert/update submitter profiles
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public can upsert profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Problems: Anyone can read problems; anyone can insert (anonymous or authenticated)
CREATE POLICY "Public can view problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Public can insert problems" ON public.problems FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update problems" ON public.problems FOR UPDATE USING (true);

-- Problem Categories: Anyone can read categories
CREATE POLICY "Public can view categories" ON public.problem_categories FOR SELECT USING (true);

-- Problem Clusters: Anyone can view and update clusters
CREATE POLICY "Public can view clusters" ON public.problem_clusters FOR SELECT USING (true);
CREATE POLICY "Public can insert clusters" ON public.problem_clusters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update clusters" ON public.problem_clusters FOR UPDATE USING (true);
CREATE POLICY "Public can view cluster members" ON public.problem_cluster_members FOR SELECT USING (true);
CREATE POLICY "Public can insert cluster members" ON public.problem_cluster_members FOR INSERT WITH CHECK (true);

-- AI Analysis & Similarities: Public read and insert
CREATE POLICY "Public can view ai analysis" ON public.problem_ai_analysis FOR SELECT USING (true);
CREATE POLICY "Public can insert ai analysis" ON public.problem_ai_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view similarities" ON public.problem_similarities FOR SELECT USING (true);
CREATE POLICY "Public can insert similarities" ON public.problem_similarities FOR INSERT WITH CHECK (true);

-- Problem Locations: Anyone can insert and view locations
CREATE POLICY "Public can view locations" ON public.problem_locations FOR SELECT USING (true);
CREATE POLICY "Public can insert locations" ON public.problem_locations FOR INSERT WITH CHECK (true);

-- Problem Supports: Anyone can view; authenticated or session users can insert
CREATE POLICY "Public can view supports" ON public.problem_supports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert supports" ON public.problem_supports FOR INSERT WITH CHECK (true);

-- Audit Logs: Admin only (service role has full bypass)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
