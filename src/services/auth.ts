import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { t } from '@/i18n';

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'cancelled' | 'config' | 'error'; message?: string };

const REDIRECT_PATH = 'auth-callback';

const buildRedirectTo = (): string =>
  AuthSession.makeRedirectUri({ scheme: 'mimi', path: REDIRECT_PATH });

const parseTokensFromUrl = (
  url: string,
): { accessToken: string; refreshToken: string } | null => {
  // Supabase redirects with tokens in either the hash fragment or the
  // query string depending on flow. Cover both.
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const slice =
    hashIndex >= 0
      ? url.slice(hashIndex + 1)
      : queryIndex >= 0
        ? url.slice(queryIndex + 1)
        : '';
  if (!slice) return null;
  const params = new URLSearchParams(slice);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
};

export const signInWithGoogle = async (): Promise<SignInResult> => {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: 'config',
      message: t('auth.configMissing'),
    };
  }
  const redirectTo = buildRedirectTo();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return {
      ok: false,
      reason: 'error',
      message: error?.message ?? t('auth.noAuthUrl'),
    };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false, reason: 'cancelled' };
  }
  if (result.type !== 'success' || !result.url) {
    return { ok: false, reason: 'error', message: t('auth.flowIncomplete') };
  }

  const tokens = parseTokensFromUrl(result.url);
  if (!tokens) {
    return {
      ok: false,
      reason: 'error',
      message: t('auth.tokensUnreadable'),
    };
  }

  const { data: setData, error: setErr } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (setErr || !setData?.session) {
    return {
      ok: false,
      reason: 'error',
      message: setErr?.message ?? t('auth.sessionFailed'),
    };
  }
  return { ok: true, session: setData.session };
};

export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export const signInWithApple = async (): Promise<SignInResult> => {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason: 'config',
      message: t('auth.configMissing'),
    };
  }
  if (Platform.OS !== 'ios') {
    return {
      ok: false,
      reason: 'config',
      message: t('auth.appleUnsupported'),
    };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const idToken = credential.identityToken;
    if (!idToken) {
      return {
        ok: false,
        reason: 'error',
        message: t('auth.appleNoToken'),
      };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
    });

    if (error || !data.session) {
      return {
        ok: false,
        reason: 'error',
        message: error?.message ?? t('auth.sessionFailed'),
      };
    }

    // Apple only sends fullName the first time. Backfill the user's
    // metadata with it so the UI shows a friendly name.
    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) {
      await supabase.auth
        .updateUser({ data: { full_name: fullName, name: fullName } })
        .catch(() => {});
    }

    return { ok: true, session: data.session };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'ERR_REQUEST_CANCELED' || e.code === 'ERR_CANCELED') {
      return { ok: false, reason: 'cancelled' };
    }
    return {
      ok: false,
      reason: 'error',
      message: e.message ?? t('auth.flowIncomplete'),
    };
  }
};

export const signOut = async (): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut().catch(() => {});
};

/**
 * Permanently deletes the current user's account and all their data
 * — App Store guideline 5.1.1(v) compliant.
 *
 * Server side: invokes the `delete-account` Supabase Edge Function
 * (see supabase/functions/delete-account/index.ts) which uses the
 * service-role key to call auth.admin.deleteUser(user.id). All
 * user-owned tables (profiles, babies, sleep_sessions, care_events,
 * preferences) cascade via `on delete cascade` on user_id, so a
 * single auth deletion wipes them in one shot.
 *
 * Client side: the local AsyncStorage / widget App Group state is
 * wiped by the caller via wipeLocalData() once this returns ok.
 *
 * Apple Sign In token revocation (best practice for users that
 * signed in via Apple) is performed by the Edge Function on the
 * server side using the Apple key configured in Supabase Auth.
 */
export const deleteAccount = async (): Promise<{ ok: boolean; message?: string }> => {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: t('auth.notConfigured') };
  }
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) {
    return { ok: false, message: error.message };
  }
  await supabase.auth.signOut().catch(() => {});
  return { ok: true };
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};
