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

// expo-auth-session/providers/google validates clientIds at hook-init
// time and render-crashes if any platform's slot is missing. We can't
// skip the hook (Rules of Hooks), so when nothing is configured we feed
// a syntactically-valid placeholder and gate the actual sign-in call on
// `configured` instead. The placeholder is a real-looking client id that
// Google will reject with `invalid_client` if the user ever gets that
// far without having set their own .env values.
const PLACEHOLDER_CLIENT_ID = '0.apps.googleusercontent.com';

export const useGoogleSignIn = (): UseGoogleSignInResult => {
  const envWeb = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const envIos = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const envAndroid = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const configured = !!(envWeb || envIos || envAndroid);

  const webClientId = envWeb || PLACEHOLDER_CLIENT_ID;
  const iosClientId = envIos || envWeb || PLACEHOLDER_CLIENT_ID;
  const androidClientId = envAndroid || envWeb || PLACEHOLDER_CLIENT_ID;

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
    if (!configured || !request) return;
    try {
      await promptAsync();
    } catch {
      // User cancelled or transient failure — silent.
    }
  };

  return { ready: configured && !!request, signIn };
};
