import { supabase, isSupabaseConfigured } from './supabase';
import type { Preferences } from '@/state/babyStore';

interface PreferencesRow {
  user_id: string;
  use_24h: boolean;
  reminders_enabled: boolean;
  bedtime_reminder: boolean;
  active_baby_id: string | null;
  updated_at: string;
}

const toPreferences = (row: PreferencesRow): Preferences => ({
  use24h: row.use_24h,
  remindersEnabled: row.reminders_enabled,
  bedtimeReminder: row.bedtime_reminder,
});

export const getPreferencesRemote = async (
  userId: string,
): Promise<{ preferences: Preferences | null; activeBabyId: string | null }> => {
  if (!isSupabaseConfigured()) {
    return { preferences: null, activeBabyId: null };
  }
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    return { preferences: null, activeBabyId: null };
  }
  const row = data as PreferencesRow;
  return {
    preferences: toPreferences(row),
    activeBabyId: row.active_baby_id,
  };
};

/** Upsert the user's preferences row. Active baby id is optional. */
export const setPreferencesRemote = async (
  userId: string,
  preferences: Preferences,
  activeBabyId?: string | null,
): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const payload: Record<string, unknown> = {
    user_id: userId,
    use_24h: preferences.use24h,
    reminders_enabled: preferences.remindersEnabled,
    bedtime_reminder: preferences.bedtimeReminder,
  };
  if (activeBabyId !== undefined) {
    payload.active_baby_id = activeBabyId;
  }
  await supabase
    .from('preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[preferences.upsert]', error.message);
      }
    });
};
