-- Mimi: align babies.id with the text-style IDs that the client emits.
-- The client (`makeId()`) generates short text IDs, not UUIDs.
-- Run this BEFORE re-running 0002_sleep_care_prefs.sql.
--
-- Safe to run on a babies table that already has rows: uuid -> text is a
-- straight cast and preserves all values.

-- Drop dependent tables from the failed 0002 run (if any partial state).
drop table if exists public.sleep_sessions cascade;
drop table if exists public.care_events    cascade;
drop table if exists public.preferences    cascade;

-- Convert babies.id from uuid to text in place. Primary key and existing
-- rows are preserved.
alter table public.babies
  alter column id type text using id::text;

-- After this, re-run 0002_sleep_care_prefs.sql to recreate the dependent
-- tables with matching text foreign keys.
