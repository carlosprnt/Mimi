import { supabase, isSupabaseConfigured } from './supabase';
import type { CareEvent, CareEventKind } from '@/logic/careEvents';

interface CareEventRow {
  id: string;
  user_id: string;
  baby_id: string;
  kind: CareEventKind;
  at: string;
  created_at: string;
  updated_at: string;
}

const toCareEvent = (row: CareEventRow): CareEvent => ({
  id: row.id,
  kind: row.kind,
  at: row.at,
});

const toRow = (
  userId: string,
  babyId: string,
  e: CareEvent,
): Omit<CareEventRow, 'created_at' | 'updated_at'> => ({
  id: e.id,
  user_id: userId,
  baby_id: babyId,
  kind: e.kind,
  at: e.at,
});

/**
 * Pulls every care event belonging to this user, grouped by baby_id.
 * Used at session bootstrap.
 */
export const listCareEventsByBaby = async (
  userId: string,
): Promise<Record<string, CareEvent[]>> => {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabase
    .from('care_events')
    .select('*')
    .eq('user_id', userId)
    .order('at', { ascending: false });
  if (error || !data) return {};
  const grouped: Record<string, CareEvent[]> = {};
  for (const row of data as CareEventRow[]) {
    const list = grouped[row.baby_id] ?? [];
    list.push(toCareEvent(row));
    grouped[row.baby_id] = list;
  }
  return grouped;
};

export const upsertCareEvent = async (
  userId: string,
  babyId: string,
  event: CareEvent,
): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('care_events')
    .upsert(toRow(userId, babyId, event), { onConflict: 'id' })
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[careEvents.upsert]', error.message);
      }
    });
};

export const deleteCareEventRemote = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('care_events')
    .delete()
    .eq('id', id)
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[careEvents.delete]', error.message);
      }
    });
};
