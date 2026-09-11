-- =============================================================================
-- ARTIX Database Seed File
-- Platform: ARTIX Problem Collection Platform
-- Brand: CodeArtix | Founder: Santhoshkumar
-- NOTE: Contains production categories and OPTIONAL DEMO DATA (clearly labeled).
-- =============================================================================

-- Production Categories
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

-- -----------------------------------------------------------------------------
-- [DEMO DATA] Optional Sample Seed Data for Local Demonstration
-- Tagged clearly with status = 'active'
-- -----------------------------------------------------------------------------
INSERT INTO public.problem_clusters (id, name, slug, description, category_id, report_count, unique_contributors, growth_rate, signal_score) VALUES
('22222222-2222-2222-2222-222222222201', 'Difficulty Finding Nutritious Affordable Meals Near Tech Parks', 'healthy-meals-near-tech-parks', 'Urban working professionals struggle to obtain quick, healthy, budget-friendly meals during workday lunch hours.', '11111111-1111-1111-1111-111111111108', 482, 394, 28.5, 91),
('22222222-2222-2222-2222-222222222202', 'Unpredictable Public Transit Timings After 9 PM', 'unpredictable-transit-after-9pm', 'Night-shift workers and commuters experience prolonged stranded wait times due to uncoordinated evening bus schedules.', '11111111-1111-1111-1111-111111111106', 318, 290, 19.2, 86),
('22222222-2222-2222-2222-222222222203', 'Complex Independent Medical Billing Discrepancies', 'medical-billing-discrepancies', 'Patients and caregivers spend dozens of hours reconciling disparate hospital invoices, insurance codes, and pharmacy receipts.', '11111111-1111-1111-1111-111111111104', 245, 210, 15.4, 82),
('22222222-2222-2222-2222-222222222204', 'Fragmented Freelance Invoice Collection and Late Payments', 'freelance-invoice-late-payments', 'Independent contractors face cash-flow crises due to fragmented 60-day client payment terms and manual reminder overhead.', '11111111-1111-1111-1111-111111111103', 176, 160, 22.1, 79)
ON CONFLICT (slug) DO NOTHING;
