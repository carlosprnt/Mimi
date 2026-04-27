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

const hydrateBabies = async (
  userId: string,
  previousUserId: string | null,
): Promise<void> => {
  const remote = await listBabies(userId);
  // If the signed-in user changed, blow away the previous user's babies
  // unconditionally — even if `remote` is empty — so a fresh account
  // doesn't see the prior user's data leaked through.
  if (previousUserId && previousUserId !== userId) {
    useBabyStore.getState().setBabies(remote);
    return;
  }
  // Same user re-signing in: only overwrite when there's something to
  // overwrite with, otherwise the local cache stays as-is.
  if (remote.length > 0) {
    useBabyStore.getState().setBabies(remote);
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
  await hydrateBabies(user.id, previousUserId);
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
