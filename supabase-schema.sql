-- ============================================================
-- RAAS RODEO PLATFORM — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ticket_allocation INTEGER NOT NULL DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  venmo_handle TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('admin', 'staff', 'liaison', 'competitor', 'audience')),
  position TEXT NOT NULL CHECK (position IN (
    'Director', 'Finance Chair', 'Hospitality Chair', 'Logistics Chair',
    'Show Chair', 'Social Chair', 'Public Relations Chair', 'Tech Chair',
    'Marketing Chair', 'J&O Chair', 'Head Liaison', 'Freshman Rep',
    'Liaison', 'Competitor', 'Audience'
  )),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('competitor', 'ff', 'public')),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'assigned', 'paid', 'picked_up')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- stored in cents
  method TEXT NOT NULL CHECK (method IN ('stripe', 'venmo', 'zelle', 'team')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  external_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES people(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  category TEXT NOT NULL CHECK (category IN ('transport', 'food', 'show', 'hotel', 'logistics')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fundraising', 'reminder', 'confirmation')),
  status TEXT NOT NULL DEFAULT 'not_sent' CHECK (status IN ('not_sent', 'sent', 'responded')),
  last_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONSTRAINTS / BUSINESS RULES
-- ============================================================

-- Competitors and liaisons MUST have a team
ALTER TABLE people ADD CONSTRAINT competitor_needs_team
  CHECK (
    (role_type NOT IN ('competitor', 'liaison')) OR (team_id IS NOT NULL)
  );

-- Staff, admin, audience MUST NOT have a team
ALTER TABLE people ADD CONSTRAINT staff_no_team
  CHECK (
    (role_type NOT IN ('staff', 'admin', 'audience')) OR (team_id IS NULL)
  );

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_team_id ON people(team_id);
CREATE INDEX IF NOT EXISTS idx_people_role_type ON people(role_type);
CREATE INDEX IF NOT EXISTS idx_tickets_person_id ON tickets(person_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_payments_person_id ON payments(person_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_outreach_person_id ON outreach(person_id);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS (used by API routes)
-- Public read for teams/people used by public ticket purchase
CREATE POLICY "service_role_all_teams" ON teams FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_people" ON people FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_tickets" ON tickets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_payments" ON payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_tasks" ON tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_outreach" ON outreach FOR ALL USING (auth.role() = 'service_role');

-- Anon can read teams (for public landing page)
CREATE POLICY "anon_read_teams" ON teams FOR SELECT USING (true);

-- ============================================================
-- SEED: INITIAL TEAMS (customize as needed)
-- ============================================================

INSERT INTO teams (name, ticket_allocation) VALUES
  ('Team Alpha', 30),
  ('Team Beta', 30),
  ('Team Gamma', 30),
  ('Team Delta', 30),
  ('Team Epsilon', 30),
  ('Team Zeta', 30),
  ('Team Eta', 30),
  ('Team Theta', 30)
ON CONFLICT DO NOTHING;
