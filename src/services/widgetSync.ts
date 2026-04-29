import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.carlospariente.mimi';
const KEY = 'mimiWidgetState';

export interface WidgetState {
  /** ISO timestamp when the active sleep session started, or null. */
  sleepStartedAt: string | null;
  /** 'nap' | 'night' for the active session, if any. */
  sleepKind: 'nap' | 'night' | null;
  /** Hint for the start button when nothing is active. */
  nextActionKind: 'nap' | 'night' | null;
  /** Friendly recommendation eyebrow. */
  recommendationEyebrow: string | null;
  /** Body of the recommendation. */
  recommendationBody: string | null;
  /** 7 day labels (oldest → newest). */
  weekLabels: string[] | null;
  /** Per-day night sleep duration in ms. */
  weekNightMs: number[] | null;
  /** Average night sleep across the week (ms). */
  weekAverageMs: number | null;
  /** Active baby's display name. */
  babyName: string | null;
}

const empty: WidgetState = {
  sleepStartedAt: null,
  sleepKind: null,
  nextActionKind: null,
  recommendationEyebrow: null,
  recommendationBody: null,
  weekLabels: null,
  weekNightMs: null,
  weekAverageMs: null,
  babyName: null,
};

let last: WidgetState = empty;

const shallowEqual = (a: WidgetState, b: WidgetState): boolean => {
  return (
    a.sleepStartedAt === b.sleepStartedAt &&
    a.sleepKind === b.sleepKind &&
    a.nextActionKind === b.nextActionKind &&
    a.recommendationEyebrow === b.recommendationEyebrow &&
    a.recommendationBody === b.recommendationBody &&
    a.weekAverageMs === b.weekAverageMs &&
    a.babyName === b.babyName &&
    JSON.stringify(a.weekLabels) === JSON.stringify(b.weekLabels) &&
    JSON.stringify(a.weekNightMs) === JSON.stringify(b.weekNightMs)
  );
};

/**
 * Pushes a new widget snapshot to the App Group's shared UserDefaults
 * so the iOS Widget Extension can pick it up. No-ops on Android and
 * when the snapshot hasn't actually changed.
 */
export const syncWidget = async (state: Partial<WidgetState>): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  const next: WidgetState = { ...last, ...state };
  if (shallowEqual(next, last)) return;
  last = next;
  try {
    await SharedGroupPreferences.setItem(KEY, JSON.stringify(next), APP_GROUP);
  } catch {
    // Module may not be linked (e.g. running in Expo Go). Fail silently.
  }
};

export const clearWidget = async (): Promise<void> => {
  await syncWidget(empty);
};
