import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearWidget } from './widgetSync';

/**
 * Keys used by all Zustand persist() middleware in the app. Keep in
 * sync with each store's `name` option. If you add a new persisted
 * store, add its key here so account deletion wipes it cleanly.
 */
const PERSIST_KEYS = [
  'mimi-auth',
  'mimi-baby',
  'mimi-sleep',
  'mimi-care-events',
  'mimi-onboarding-draft',
];

/**
 * Removes every locally persisted slice of user data from this
 * device. Used by the account-deletion flow after the server-side
 * delete succeeds, and as a safety net inside sign-out + delete
 * flows so a guest who logs in later starts from a clean slate.
 *
 *   - AsyncStorage entries written by Zustand persist middleware
 *   - Supabase auth-token entries (anything starting with `sb-`)
 *     so a stale session can't auto-resume on the next launch
 *   - Widget App Group payload (sleep timer / suggestion / weekly
 *     stats) so the widget doesn't keep showing stale data after
 *     deletion
 *
 * Errors are swallowed: a half-removed key is still better than a
 * full re-throw blocking the UI flow.
 */
export const wipeLocalData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(PERSIST_KEYS);
  } catch {
    // Swallow — best-effort wipe.
  }
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const supabaseKeys = allKeys.filter((k) => k.startsWith('sb-'));
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
    }
  } catch {
    // ignore
  }
  await clearWidget();
};
