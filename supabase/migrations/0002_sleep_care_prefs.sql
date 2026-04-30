-- Mimi: sleep sessions, care events, preferences with strict RLS.
-- Run this AFTER 0001_init.sql in the Supabase SQL editor.

create table if not exists public.sleep_sessions (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  baby_id     text not null references public.babies(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  kind        text not null check (kind in ('night','nap')),
  micro_nap   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists sleep_sessions_user_baby_idx
  on public.sleep_sessions(user_id, baby_id);

create table if not exists public.care_events (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  baby_id     text not null references public.babies(id) on delete cascade,
  kind        text not null check (kind in ('feeding','diaper','nightWake','morningWake')),
  at          timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists care_events_user_baby_idx
  on public.care_events(user_id, baby_id);

create table if not exists public.preferences (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  use_24h            boolean not null default true,
  reminders_enabled  boolean not null default false,
  bedtime_reminder   boolean not null default false,
  active_baby_id     text,
  updated_at         timestamptz not null default now()
);

alter table public.sleep_sessions enable row level security;
alter table public.care_events enable row level security;
alter table public.preferences enable row level security;

drop policy if exists "own sessions" on public.sleep_sessions;
create policy "own sessions" on public.sleep_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own care events" on public.care_events;
create policy "own care events" on public.care_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own prefs" on public.preferences;
create policy "own prefs" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists sleep_sessions_touch on public.sleep_sessions;
create trigger sleep_sessions_touch
  before update on public.sleep_sessions
  for each row execute procedure public.touch_updated_at();

drop trigger if exists care_events_touch on public.care_events;
create trigger care_events_touch
  before update on public.care_events
  for each row execute procedure public.touch_updated_at();

drop trigger if exists preferences_touch on public.preferences;
create trigger preferences_touch
  before update on public.preferences
  for each row execute procedure public.touch_updated_at();
