import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ENTITLEMENT_ID = 'mimi_pro';
export const OFFERING_ID = 'default';

/**
 * Public RevenueCat API keys are exposed via Expo public env vars.
 * Configure these in `.env` (or via EAS) before shipping:
 *
 *   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
 *   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
 *
 * Without a key the wrapper falls back to a safe Free-plan mock and
 * never hits the network, so the app stays usable in dev / Expo Go.
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

/**
 * `react-native-purchases` ships a native module that is NOT embedded
 * in Expo Go. Detect Expo Go via expo-constants and bail out before
 * even requiring the package, otherwise the JS bridge throws on
 * import. An env override (`EXPO_PUBLIC_DISABLE_REVENUECAT=1`) is also
 * honored for dev builds without StoreKit access.
 */
export function isRevenueCatRuntimeAvailable(): boolean {
  if (process.env.EXPO_PUBLIC_DISABLE_REVENUECAT === '1') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export const RC_MONTHLY_IDENTIFIER = '$rc_monthly';
export const RC_ANNUAL_IDENTIFIER = '$rc_annual';
