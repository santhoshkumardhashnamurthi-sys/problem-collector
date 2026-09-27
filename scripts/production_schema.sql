-- =============================================================================
-- ARTIX Problem Collector — Production PostgreSQL Database Schema
-- Brand: CodeArtix | Founder: Santhoshkumar Dhashnamurthi
-- 100% Idempotent: Safe to execute on existing databases without data loss.
-- =============================================================================

-- 1. Atomic Sequence Counter Table
CREATE TABLE IF NOT EXISTS artix_counter (
  name VARCHAR(32) PRIMARY KEY,
  current_val BIGINT NOT NULL
);

-- Seed baseline sequence counter at 12 (so next generated is ARTIX-000013)
INSERT INTO artix_counter (name, current_val)
VALUES ('problem_seq', 12)
ON CONFLICT (name) DO NOTHING;

-- 2. Master Problems Table
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

-- Indexes for lightning-fast queries and filters
CREATE INDEX IF NOT EXISTS idx_artix_problems_created ON artix_problems (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artix_problems_code ON artix_problems (problem_code);
CREATE INDEX IF NOT EXISTS idx_artix_problems_category ON artix_problems (category_name);
CREATE INDEX IF NOT EXISTS idx_artix_problems_status ON artix_problems (status);

-- 3. Seed Baseline Historical Records (ARTIX-000001 to ARTIX-000012)
-- ON CONFLICT DO NOTHING guarantees existing records are NEVER overwritten or deleted.
INSERT INTO artix_problems (
  id, problem_code, user_id, submitter_name, raw_description,
  normalized_problem, category_name, user_type, frequency, severity,
  city, is_anonymous, status, created_at, updated_at
) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000012', 'ARTIX-000012', NULL, 'Community Member', 'Crowded classrooms and poor ventilation make it difficult for students to focus during summer months in government colleges.', 'Crowded classrooms and poor ventilation impede focus in government colleges during summer', 'Education', 'Students', 'Daily', 'Moderate', 'Salem', true, 'active', '2026-09-27T16:44:41.327Z', '2026-09-27T16:44:41.327Z'),
  ('a1b2c3d4-0001-4000-8000-000000000011', 'ARTIX-000011', NULL, 'Community Member', 'my clg is very strict and harsh rules', 'Strict college regulations and harsh rules creating student friction', 'Education', 'Students', 'Daily', 'Moderate', 'Tiruchirappalli', true, 'active', '2026-09-27T16:41:58.718Z', '2026-09-27T16:41:58.718Z'),
  ('a1b2c3d4-0001-4000-8000-000000000010', 'ARTIX-000010', NULL, 'Community Member', 'Unreliable frequency of feeder buses from metro stations forces long auto rickshaw wait times and inflated fares.', 'Unreliable metro feeder bus frequency leading to commute delays and fare inflation', 'Transport', 'Working Professionals', 'Daily', 'Moderate', 'Chennai', true, 'active', '2026-09-12T10:00:00.000Z', '2026-09-12T10:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000009', 'ARTIX-000009', NULL, 'Community Member', 'Finding verified local plumbers and electricians without paying platform middlemen commissions remains frustrating.', 'Middlemen platform commission markups on local home repair technicians', 'Daily Life', 'Everyone', 'Weekly', 'Moderate', 'Coimbatore', true, 'active', '2026-09-11T12:00:00.000Z', '2026-09-11T12:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000008', 'ARTIX-000008', NULL, 'Community Member', 'Small grocery store owners lose hours reconciling mismatched UPI merchant settlements against physical invoices.', 'UPI merchant settlement reconciliation overhead for small retail grocery stores', 'Business', 'Business Owners', 'Daily', 'Moderate', 'Madurai', true, 'active', '2026-09-10T14:00:00.000Z', '2026-09-10T14:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000007', 'ARTIX-2026-0007', NULL, 'Community Member', 'Government hospital OPD queues lack digital token tracking, causing elderly patients to stand for hours.', 'Lack of real-time digital token tracking in government hospital OPD queues', 'Healthcare', 'Senior Citizens', 'Daily', 'Moderate', 'Chennai', true, 'active', '2026-09-08T09:00:00.000Z', '2026-09-08T09:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000006', 'ARTIX-2026-0006', NULL, 'Community Member', 'Unavailability of safe, well-lit bicycle parking spots near suburban railway stations discourages green commuting.', 'Lack of secure bicycle parking facilities at suburban commuter transit stations', 'Transport', 'Working Professionals', 'Daily', 'Moderate', 'Bengaluru', true, 'active', '2026-09-05T08:30:00.000Z', '2026-09-05T08:30:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'ARTIX-2026-0005', NULL, 'Community Member', 'Apartment complexes have no streamlined way to coordinate emergency water tanker deliveries during summer shortages.', 'Uncoordinated residential water tanker delivery logistics during seasonal shortages', 'Daily Life', 'Everyone', 'Weekly', 'Moderate', 'Hyderabad', true, 'active', '2026-09-02T11:00:00.000Z', '2026-09-02T11:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'ARTIX-2026-0001', NULL, 'Community Member', 'College students cannot find verified peer notes and previous year question bank solutions tailored to autonomous university syllabi.', 'Fragmented access to verified study material and syllabus solutions for autonomous colleges', 'Education', 'Students', 'Daily', 'Moderate', 'Coimbatore', true, 'active', '2026-08-25T10:00:00.000Z', '2026-08-25T10:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'ARTIX-2026-0002', NULL, 'Community Member', 'Interstate bus passengers face sudden unannounced cancellation of private buses with delayed refund processing.', 'Unannounced private interstate bus cancellations and prolonged refund cycles', 'Transport', 'Everyone', 'Weekly', 'Moderate', 'Chennai', true, 'active', '2026-08-20T15:00:00.000Z', '2026-08-20T15:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'ARTIX-2026-0003', NULL, 'Community Member', 'Home bakers and cloud kitchens struggle to source affordable temperature-controlled delivery partners for perishable baked goods.', 'Lack of affordable cold-chain last-mile delivery services for micro food entrepreneurs', 'Business', 'Business Owners', 'Daily', 'Moderate', 'Bengaluru', true, 'active', '2026-08-15T12:00:00.000Z', '2026-08-15T12:00:00.000Z'),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'ARTIX-2026-0004', NULL, 'Community Member', 'Elderly residents living alone have difficulty reading small-print medicine dosage instructions and prescription schedules.', 'Small-print medication label illegibility creating prescription adherence risks for seniors', 'Healthcare', 'Senior Citizens', 'Daily', 'Moderate', 'Madurai', true, 'active', '2026-08-10T16:00:00.000Z', '2026-08-10T16:00:00.000Z')
ON CONFLICT (problem_code) DO NOTHING;

-- 4. Dynamic Counter Alignment
-- Guarantees the counter is set to at least 12 or the highest existing numeric ID,
-- so the next generated problem code is guaranteed to be ARTIX-000013, then ARTIX-000014, etc.
DO $$
DECLARE
  max_code BIGINT;
BEGIN
  SELECT MAX(SUBSTRING(problem_code FROM '(\d{6})$')::BIGINT)
  INTO max_code
  FROM artix_problems
  WHERE problem_code ~* '^ARTIX-\d{6}$';

  IF max_code IS NOT NULL AND max_code >= 12 THEN
    UPDATE artix_counter
    SET current_val = GREATEST(current_val, max_code)
    WHERE name = 'problem_seq';
  END IF;
END $$;
