import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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
  // Log so we can see the EXACT redirect URI being sent. In Expo Go this
  // is an `exp://...` URL that must be whitelisted in Supabase →
  // Authentication → URL Configuration → Redirect URLs.
  // eslint-disable-next-line no-console
  console.log('[auth] redirectTo →', redirectTo);

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

export const signOut = async (): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut().catch(() => {});
};

/**
 * Permanently deletes the current user's account and all their data.
 * Requires a Supabase Edge Function named "delete-account" that uses the
 * service role key to call `auth.admin.deleteUser`. RLS-managed tables
 * (babies, sleep_sessions, care_events, profiles) are expected to cascade
 * via `on delete cascade` on the user_id foreign keys.
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
