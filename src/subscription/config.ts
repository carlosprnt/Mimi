import { Platform } from 'react-native';

export const ENTITLEMENT_ID = 'mimi_pro';
export const OFFERING_ID = 'default';

/**
 * Public RevenueCat API keys are exposed via Expo public env vars.
 * Configure these in `.env` (or via EAS) before shipping:
 *
 *   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
 *   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
 *
 * If no key is present at runtime we fall back to a safe mock that
 * keeps the app on the Free plan and never hits the network.
 */
export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || null;
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || null;
  }
  return null;
}

export const RC_MONTHLY_IDENTIFIER = '$rc_monthly';
export const RC_ANNUAL_IDENTIFIER = '$rc_annual';
