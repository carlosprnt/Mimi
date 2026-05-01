import { Keyframe } from 'react-native-reanimated';

/**
 * Reanimated layout animations shared across the onboarding flow.
 *
 * On step changes the body content of the leaving screen runs
 * `ONBOARDING_EXIT` (fade-out + slight scale-down + tiny horizontal
 * shake), and the body content of the entering screen runs
 * `ONBOARDING_ENTER` (the inverse). Combined with the fixed header
 * overlay this reads as "the elements blur/vibrate out and the next
 * step's elements appear in their place" without the whole screen
 * sliding.
 */
export const ONBOARDING_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }, { translateX: 0 }] },
  25: {
    opacity: 0.4,
    transform: [{ scale: 0.97 }, { translateX: 2 }],
  },
  50: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }, { translateX: -1.5 }],
  },
  75: {
    opacity: 0.95,
    transform: [{ scale: 1 }, { translateX: 1 }],
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }, { translateX: 0 }],
  },
}).duration(420);

export const ONBOARDING_EXIT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }, { translateX: 0 }] },
  25: {
    opacity: 0.85,
    transform: [{ scale: 1 }, { translateX: -1.5 }],
  },
  50: {
    opacity: 0.45,
    transform: [{ scale: 0.99 }, { translateX: 1.5 }],
  },
  75: {
    opacity: 0.18,
    transform: [{ scale: 0.97 }, { translateX: -1 }],
  },
  100: {
    opacity: 0,
    transform: [{ scale: 0.95 }, { translateX: 0 }],
  },
}).duration(280);
