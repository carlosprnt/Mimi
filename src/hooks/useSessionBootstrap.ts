import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { listBabies } from '@/services/babies';
import { useAuthStore, type AuthUser } from '@/state/authStore';
import { useBabyStore } from '@/state/babyStore';
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

const hydrateBabies = async (userId: string): Promise<void> => {
  const remote = await listBabies(userId);
  if (remote.length === 0) return;
  useBabyStore.getState().setBabies(remote);
};

const applySession = async (session: Session | null): Promise<void> => {
  const auth = useAuthStore.getState();
  if (!session?.user) {
    auth.signOut();
    return;
  }
  const user = userFromSession(session.user);
  auth.signIn(user);
  await hydrateBabies(user.id);
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
