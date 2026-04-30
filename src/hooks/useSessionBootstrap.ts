import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { listBabies } from '@/services/babies';
import { listSessionsByBaby } from '@/services/sessions';
import { listCareEventsByBaby } from '@/services/careEvents';
import { getPreferencesRemote } from '@/services/preferences';
import { useAuthStore, type AuthUser } from '@/state/authStore';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';
import type { Session, User } from '@supabase/supabase-js';

const userFromSession = (user: User): AuthUser => {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const provider =
    (user.app_metadata?.provider as 'google' | 'apple' | undefined) ?? 'google';
  return {
    id: user.id,
    email: user.email ?? undefined,
    name:
      typeof meta.full_name === 'string'
        ? meta.full_name
        : typeof meta.name === 'string'
          ? meta.name
          : undefined,
    picture:
      typeof meta.avatar_url === 'string'
        ? meta.avatar_url
        : typeof meta.picture === 'string'
          ? meta.picture
          : undefined,
    provider,
  };
};

const hydrateFromBackend = async (
  userId: string,
  previousUserId: string | null,
): Promise<void> => {
  // Pull everything in parallel.
  const [babies, sessionsByBaby, eventsByBaby, prefs] = await Promise.all([
    listBabies(userId),
    listSessionsByBaby(userId),
    listCareEventsByBaby(userId),
    getPreferencesRemote(userId),
  ]);

  // Babies: blow away on user change. Same user → keep local cache if
  // server has nothing yet (first sync from a new install).
  if (previousUserId && previousUserId !== userId) {
    useBabyStore.getState().setBabies(babies);
  } else if (babies.length > 0) {
    useBabyStore.getState().setBabies(babies);
  }

  // Sessions / care events: same rule. We trust the server as the
  // source of truth when it has data, otherwise leave the local cache
  // alone so an offline user doesn't lose stuff.
  if (previousUserId && previousUserId !== userId) {
    useSleepStore.getState().hydrateAll(sessionsByBaby);
    useCareEventStore.getState().hydrateAll(eventsByBaby);
  } else {
    if (Object.keys(sessionsByBaby).length > 0) {
      useSleepStore.getState().hydrateAll(sessionsByBaby);
    }
    if (Object.keys(eventsByBaby).length > 0) {
      useCareEventStore.getState().hydrateAll(eventsByBaby);
    }
  }

  // Preferences: server wins when present.
  if (prefs.preferences) {
    useBabyStore.getState().setPreferences(prefs.preferences);
  }
  if (prefs.activeBabyId) {
    useBabyStore.getState().setActiveBabyId(prefs.activeBabyId);
  }
};

const applySession = async (session: Session | null): Promise<void> => {
  const auth = useAuthStore.getState();
  if (!session?.user) {
    auth.signOut();
    return;
  }
  const previousUserId = auth.user?.id ?? null;
  const user = userFromSession(session.user);
  auth.signIn(user);
  await hydrateFromBackend(user.id, previousUserId);
};

export const useSessionBootstrap = (): void => {
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      useAuthStore.getState().markHydrated();
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      await applySession(data.session ?? null);
      useAuthStore.getState().markHydrated();
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
};
