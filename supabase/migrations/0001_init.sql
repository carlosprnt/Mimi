-- Mimi: profiles + babies with strict RLS (auth.uid() = user_id).
-- Apply in Supabase SQL editor (paste and run).

create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  provider     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.babies (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  sex              text check (sex in ('girl','boy')),
  dob              date not null,
  born_at_term     boolean not null,
  due_date         date,
  premature_weeks  int,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists babies_user_id_idx on public.babies(user_id);

alter table public.profiles enable row level security;
alter table public.babies   enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own babies" on public.babies;
create policy "own babies" on public.babies
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists babies_touch on public.babies;
create trigger babies_touch
  before update on public.babies
  for each row execute procedure public.touch_updated_at();
