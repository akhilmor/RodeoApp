-- Team travel data (flights, cars, arrival/departure windows)
create table if not exists team_travel (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  person_id uuid references people(id) on delete set null,
  travel_type text not null check (travel_type in ('flight_in', 'flight_out', 'car', 'other')),
  -- For flights: airline + flight number info
  flight_number text,
  origin text,
  destination text,
  -- Datetime fields (store as timestamptz)
  departs_at timestamptz,
  arrives_at timestamptz,
  -- Car groups: who's in the car, when they leave
  notes text,
  created_at timestamptz default now()
);

-- Per-person availability / conflict windows
create table if not exists person_availability (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  label text not null,                -- e.g. "Unavailable", "On food run", "Conflict"
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  created_at timestamptz default now()
);

-- AI-generated schedule outputs (versioned, board can keep multiple drafts)
create table if not exists generated_schedules (
  id uuid primary key default gen_random_uuid(),
  label text not null,                -- e.g. "Draft 1 - Show Day", "Full Weekend v3"
  content jsonb not null,             -- structured schedule JSON from Claude
  prompt_used text,                   -- the last user message that triggered generation
  created_by uuid references people(id) on delete set null,
  created_at timestamptz default now()
);

-- Free-form context blobs the AI can reference (food logistics, venue times, misc notes)
create table if not exists schedule_context (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,           -- e.g. "food_logistics", "venue_times", "van_assignments"
  label text not null,
  content text not null,             -- raw text or JSON string
  updated_at timestamptz default now()
);

-- Chat messages for persistence (optional — board can see full history)
create table if not exists ai_planner_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_by uuid references people(id) on delete set null,
  created_at timestamptz default now()
);
