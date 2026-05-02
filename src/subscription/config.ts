import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const ENTITLEMENT_ID = 'mimi_pro';
export const OFFERING_ID = 'default';

/**
 * Returns true when the app is running inside Expo Go, where the
 * `react-native-purchases` native module is not embedded. The wrapper
 * skips the require entirely in that case.
 *
 * You can also force-disable the native module with
 *   EXPO_PUBLIC_DISABLE_REVENUECAT=1
 * which is useful when sharing dev builds without StoreKit access.
 */
export function isRevenueCatRuntimeAvailable(): boolean {
  if (process.env.EXPO_PUBLIC_DISABLE_REVENUECAT === '1') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

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
