create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  address text,
  city text default 'Austin',
  category text,               -- e.g. Indian Restaurant, Temple, Grocery, Cultural Org
  source text,                 -- google_places, manual, etc.
  google_place_id text unique,
  status text not null default 'new' check (status in ('new', 'contacted', 'responded', 'donated', 'declined')),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_prospects_status on prospects(status);
create index if not exists idx_prospects_email on prospects(email);
