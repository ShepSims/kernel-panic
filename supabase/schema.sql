-- ============================================================
-- KERNEL PANIC — leaderboard + ruleset schema
-- Paste into Supabase SQL editor. Requires pgcrypto (enabled by default).
-- ============================================================

-- A ruleset is "the exact rules a run was played under".
-- Official game versions and community mods are both rulesets.
create table if not exists rulesets (
  id          text primary key,                -- 'official-1.0.0' or 'mod-<hash16>'
  kind        text not null check (kind in ('official', 'mod')),
  name        text not null check (char_length(name) between 2 and 40),
  author      text check (author is null or char_length(author) between 2 and 24),
  description text check (description is null or char_length(description) <= 300),
  pack        jsonb,                           -- the data pack (null for official)
  version     text not null,                   -- game version the pack targets
  created_at  timestamptz not null default now()
);

create table if not exists scores (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid unique not null,          -- one submission per run
  ruleset_id    text not null references rulesets(id),
  device_id     uuid not null,
  user_id       uuid references auth.users(id) on delete set null,
  name          text not null check (char_length(name) between 2 and 16),
  mode          text not null check (mode in ('normal', 'seeded', 'endless')),
  floor         int  not null check (floor between 1 and 99),
  kills         int  not null check (kills between 0 and 100000),
  items         int  not null check (items between 0 and 500),
  time_s        int  not null check (time_s between 5 and 86400),
  win           boolean not null default false,
  endless_depth int  not null default 0 check (endless_depth between 0 and 99),
  seed          text check (seed is null or char_length(seed) <= 16),
  score         int  not null check (score between 0 and 10000000),
  created_at    timestamptz not null default now()
);

-- board indexes: one per category, always scoped by ruleset
create index if not exists scores_total    on scores (ruleset_id, score desc);
create index if not exists scores_floor    on scores (ruleset_id, floor desc, time_s asc);
create index if not exists scores_fastwin  on scores (ruleset_id, time_s asc) where win = true;
create index if not exists scores_endless  on scores (ruleset_id, endless_depth desc) where endless_depth > 0;
create index if not exists scores_device   on scores (device_id, created_at desc);

-- ---------- row level security ----------
alter table rulesets enable row level security;
alter table scores   enable row level security;

-- anyone can read boards and browse published mods
create policy "public read scores"   on scores   for select using (true);
create policy "public read rulesets" on rulesets for select using (true);

-- degraded mode (no API deployed): allow anon inserts — the CHECK constraints
-- above are the sanity floor. The Vercel API (service role, bypasses RLS)
-- adds rate limiting + server-side score recomputation on top.
create policy "anon insert scores" on scores for insert with check (
  -- plausibility: a floor takes at least ~10 seconds
  time_s >= floor * 10
  and kills <= time_s * 6
  and (not win or floor >= 6)
  and (endless_depth = 0 or mode = 'endless')
);

-- no anon writes to rulesets: publishing goes through the API,
-- which verifies the content hash matches the pack.

-- ---------- seed the official ruleset ----------
insert into rulesets (id, kind, name, version)
values ('official-1.0.0', 'official', 'KERNEL PANIC 1.0.0', '1.0.0')
on conflict (id) do nothing;
