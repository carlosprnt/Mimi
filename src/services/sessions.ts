import { supabase, isSupabaseConfigured } from './supabase';
import type { SleepSession } from '@/logic/recommendation';

interface SessionRow {
  id: string;
  user_id: string;
  baby_id: string;
  started_at: string;
  ended_at: string | null;
  kind: 'night' | 'nap';
  micro_nap: boolean;
  created_at: string;
  updated_at: string;
}

const toSession = (row: SessionRow): SleepSession => ({
  id: row.id,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  kind: row.kind,
});

const toRow = (
  userId: string,
  babyId: string,
  s: SleepSession,
): Omit<SessionRow, 'created_at' | 'updated_at' | 'micro_nap'> => ({
  id: s.id,
  user_id: userId,
  baby_id: babyId,
  started_at: s.startedAt,
  ended_at: s.endedAt,
  kind: s.kind,
});

/**
 * Pulls every sleep session belonging to this user, grouped by baby_id.
 * Used at session bootstrap.
 */
export const listSessionsByBaby = async (
  userId: string,
): Promise<Record<string, SleepSession[]>> => {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabase
    .from('sleep_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (error || !data) return {};
  const grouped: Record<string, SleepSession[]> = {};
  for (const row of data as SessionRow[]) {
    const list = grouped[row.baby_id] ?? [];
    list.push(toSession(row));
    grouped[row.baby_id] = list;
  }
  return grouped;
};

/** Insert or update a single session. Fire-and-forget; errors swallowed. */
export const upsertSession = async (
  userId: string,
  babyId: string,
  session: SleepSession,
): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('sleep_sessions')
    .upsert(toRow(userId, babyId, session), { onConflict: 'id' })
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[sessions.upsert]', error.message);
      }
    });
};

export const deleteSessionRemote = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('sleep_sessions')
    .delete()
    .eq('id', id)
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[sessions.delete]', error.message);
      }
    });
};
