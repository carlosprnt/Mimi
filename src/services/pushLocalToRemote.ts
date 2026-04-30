import { upsertBabyRemote } from './babies';
import { upsertSession } from './sessions';
import { upsertCareEvent } from './careEvents';
import { setPreferencesRemote } from './preferences';
import { useBabyStore } from '@/state/babyStore';
import { useSleepStore } from '@/state/sleepStore';
import { useCareEventStore } from '@/state/careEventStore';

/**
 * Pushes everything currently in the local Zustand stores to Supabase
 * for the given user. Used after a guest user signs in from the
 * Settings screen, so the bebés / sesiones / eventos that they had been
 * keeping locally are now bound to the account and recoverable from
 * any other device.
 *
 * Fire-and-forget: each upsert is awaited but errors are swallowed
 * (the individual service functions already log warnings). The whole
 * thing is wrapped in a single try/catch as a safety net.
 */
export const pushLocalToRemote = async (userId: string): Promise<void> => {
  try {
    const babies = useBabyStore.getState().babies;
    const preferences = useBabyStore.getState().preferences;
    const activeBabyId = useBabyStore.getState().activeBabyId;
    const sessionsByBaby = useSleepStore.getState().sessionsByBaby;
    const eventsByBaby = useCareEventStore.getState().eventsByBaby;

    await Promise.all(babies.map((baby) => upsertBabyRemote(userId, baby)));

    const sessionPromises: Promise<void>[] = [];
    for (const [babyId, list] of Object.entries(sessionsByBaby)) {
      for (const s of list) {
        sessionPromises.push(upsertSession(userId, babyId, s));
      }
    }
    await Promise.all(sessionPromises);

    const eventPromises: Promise<void>[] = [];
    for (const [babyId, list] of Object.entries(eventsByBaby)) {
      for (const e of list) {
        eventPromises.push(upsertCareEvent(userId, babyId, e));
      }
    }
    await Promise.all(eventPromises);

    await setPreferencesRemote(userId, preferences, activeBabyId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[pushLocalToRemote]', err);
  }
};
