import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore, type AuthUser } from '@/state/authStore';

WebBrowser.maybeCompleteAuthSession();

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (padded.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded + padding)
        : Buffer.from(padded + padding, 'base64').toString('utf-8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const fetchUserInfo = async (
  accessToken: string,
): Promise<Partial<AuthUser> | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch {
    return null;
  }
};

interface UseGoogleSignInResult {
  ready: boolean;
  signIn: () => Promise<void>;
}

export const useGoogleSignIn = (): UseGoogleSignInResult => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // Fall back to the web client when platform-specific ones aren't set.
  // expo-auth-session validates these strictly on iOS / Android, so without
  // a fallback the screen render-crashes when only the web client is in
  // .env. Using the web client for Expo Go OAuth (proxy via auth.expo.io)
  // is the documented workaround.
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId;
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  const signInUser = useAuthStore((s) => s.signIn);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.authentication?.accessToken;
    const idToken = (response.params as { id_token?: string })?.id_token;

    const finalize = async () => {
      let user: Partial<AuthUser> = {};
      if (idToken) {
        const payload = decodeJwtPayload(idToken);
        if (payload) {
          user = {
            id: typeof payload.sub === 'string' ? payload.sub : undefined,
            email: typeof payload.email === 'string' ? payload.email : undefined,
            name: typeof payload.name === 'string' ? payload.name : undefined,
            picture:
              typeof payload.picture === 'string' ? payload.picture : undefined,
          };
        }
      }
      if ((!user.id || !user.email) && accessToken) {
        const fetched = await fetchUserInfo(accessToken);
        if (fetched) user = { ...fetched, ...user };
      }
      if (!user.id) return;
      signInUser({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: 'google',
      });
    };

    void finalize();
  }, [response, signInUser]);

  const signIn = async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch {
      // User cancelled or transient failure — silent.
    }
  };

  return { ready: !!request, signIn };
};
