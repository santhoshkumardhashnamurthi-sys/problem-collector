-- =============================================================================
-- COMPLETE SUPABASE INITIALIZATION SCRIPT FOR ARTIX PROBLEM COLLECTOR
-- Project: xjxbwissqthvrsozjhcg
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/xjxbwissqthvrsozjhcg/sql/new
-- 2. Paste this entire script into the SQL Editor
-- 3. Click "Run" (or press Ctrl + Enter)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Profiles Table (Submitters & Contributors)
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

-- 3. Problems Table (PRIMARY TABLE FOR SUBMISSIONS)
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

-- 10. Problem Supports Table
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

-- Indexes for performance
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

-- Enable RLS on all tables
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

-- Permissive RLS Policies for Platform Operation
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public can upsert profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public can view problems" ON public.problems FOR SELECT USING (true);
CREATE POLICY "Public can insert problems" ON public.problems FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update problems" ON public.problems FOR UPDATE USING (true);

CREATE POLICY "Public can view categories" ON public.problem_categories FOR SELECT USING (true);

CREATE POLICY "Public can view clusters" ON public.problem_clusters FOR SELECT USING (true);
CREATE POLICY "Public can insert clusters" ON public.problem_clusters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update clusters" ON public.problem_clusters FOR UPDATE USING (true);
CREATE POLICY "Public can view cluster members" ON public.problem_cluster_members FOR SELECT USING (true);
CREATE POLICY "Public can insert cluster members" ON public.problem_cluster_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view ai analysis" ON public.problem_ai_analysis FOR SELECT USING (true);
CREATE POLICY "Public can insert ai analysis" ON public.problem_ai_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view similarities" ON public.problem_similarities FOR SELECT USING (true);
CREATE POLICY "Public can insert similarities" ON public.problem_similarities FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view locations" ON public.problem_locations FOR SELECT USING (true);
CREATE POLICY "Public can insert locations" ON public.problem_locations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view supports" ON public.problem_supports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert supports" ON public.problem_supports FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Seed Initial Categories
INSERT INTO public.problem_categories (id, name, slug, description, icon) VALUES
('11111111-1111-1111-1111-111111111101', 'Education', 'education', 'Learning barriers, academic accessibility, and curriculum inefficiencies', 'GraduationCap'),
('11111111-1111-1111-1111-111111111102', 'Technology', 'technology', 'Software friction, digital divide, developer bottlenecks, and tech frustration', 'Code2'),
('11111111-1111-1111-1111-111111111103', 'Business', 'business', 'Small business hurdles, compliance friction, supplier delays, and invoicing', 'Briefcase'),
('11111111-1111-1111-1111-111111111104', 'Healthcare', 'healthcare', 'Patient wait times, medical billing confusion, prescription access, and triage', 'HeartPulse'),
('11111111-1111-1111-1111-111111111105', 'Finance', 'finance', 'Banking opacity, micro-lending gaps, budget tracking, and investment access', 'CircleDollarSign'),
('11111111-1111-1111-1111-111111111106', 'Transport', 'transport', 'Public transit delays, route unpredictability, parking scarcity, and last-mile travel', 'Bus'),
('11111111-1111-1111-1111-111111111107', 'Daily Life', 'daily-life', 'Household chores, neighborhood noise, package deliveries, and routine friction', 'Home'),
('11111111-1111-1111-1111-111111111108', 'Food', 'food', 'Food waste, meal preparation, quality produce discovery, and office lunches', 'Utensils'),
('11111111-1111-1111-1111-111111111109', 'Environment', 'environment', 'Recycling ambiguity, local air quality alerts, composting, and water conservation', 'Leaf'),
('11111111-1111-1111-1111-111111111110', 'Government', 'government', 'Public service documentation, permit queues, civic reporting, and municipal services', 'Building2'),
('11111111-1111-1111-1111-111111111111', 'Other', 'other', 'Uncategorized authentic human friction points needing discovery', 'MoreHorizontal')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
