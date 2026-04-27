import { supabase, isSupabaseConfigured } from './supabase';
import { computePrematureWeeks, type OnboardingDraft } from '@/state/onboardingDraft';
import type { Baby } from '@/logic/age';
import { makeId } from '@/utils/id';

interface BabyRow {
  id: string;
  user_id: string;
  name: string;
  sex: 'girl' | 'boy' | null;
  dob: string; // YYYY-MM-DD
  born_at_term: boolean;
  due_date: string | null;
  premature_weeks: number | null;
  created_at: string;
  updated_at: string;
}

const toBaby = (row: BabyRow): Baby => ({
  id: row.id,
  name: row.name,
  dateOfBirth: row.dob,
  sex: row.sex ?? undefined,
  prematureWeeks: row.premature_weeks ?? undefined,
});

const isoDay = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export const insertBabyFromDraft = async (
  userId: string,
  draft: OnboardingDraft,
): Promise<Baby | null> => {
  if (!isSupabaseConfigured()) return null;
  if (!draft.name || !draft.dob || draft.atTerm === undefined) return null;
  const dob = isoDay(draft.dob);
  const dueDate = draft.atTerm === false ? isoDay(draft.dueDate) : null;
  const prematureWeeks =
    draft.atTerm === false
      ? computePrematureWeeks(draft.dob, draft.dueDate) ?? null
      : null;
  if (!dob) return null;

  const id = makeId();
  const { data, error } = await supabase
    .from('babies')
    .insert({
      id,
      user_id: userId,
      name: draft.name.trim(),
      sex: draft.sex ?? null,
      dob,
      born_at_term: draft.atTerm,
      due_date: dueDate,
      premature_weeks: prematureWeeks,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toBaby(data as BabyRow);
};

export const listBabies = async (userId: string): Promise<Baby[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as BabyRow[]).map(toBaby);
};

export const upsertProfile = async (
  userId: string,
  profile: { email?: string; displayName?: string; provider?: string },
): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        email: profile.email ?? null,
        display_name: profile.displayName ?? null,
        provider: profile.provider ?? null,
      },
      { onConflict: 'user_id' },
    );
};
