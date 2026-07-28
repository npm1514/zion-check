-- ─── Zion's Check — Supabase Migration ───────────────────────────────────────
-- Run this in your Supabase SQL editor or via the CLI:
--   supabase db push

-- Rooms table: one row per game session
create table if not exists public.rooms (
  id          uuid        primary key default gen_random_uuid(),
  code        text        not null unique,          -- short join code e.g. "XKQZ"
  state       jsonb       not null default '{}',    -- full GameState object
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on every write
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_updated_at on public.rooms;
create trigger rooms_updated_at
  before update on public.rooms
  for each row execute procedure public.set_updated_at();

-- Enable Row Level Security (open policy — lock down if you add auth)
alter table public.rooms enable row level security;

create policy "Allow all on rooms"
  on public.rooms for all
  using (true)
  with check (true);

-- Enable Supabase Realtime for this table
alter publication supabase_realtime add table public.rooms;

-- Index so joining by code is fast
create index if not exists rooms_code_idx on public.rooms (code);
