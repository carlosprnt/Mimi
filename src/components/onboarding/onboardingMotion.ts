import { Keyframe } from 'react-native-reanimated';

/**
 * Reanimated layout animations shared across the onboarding flow.
 *
 * On step changes the body content of the leaving screen runs
 * `ONBOARDING_EXIT` (fade-out + slight scale-down), and the body
 * content of the entering screen runs `ONBOARDING_ENTER` (the
 * inverse). The pronounced scale gives a soft "blur in / blur out"
 * feeling without the cost of a real BlurView. Combined with the
 * fixed header overlay, the visible transition reads as the elements
 * dissolving and the next step's elements forming in their place.
 *
 * Duration is intentionally long (1.3s on enter, 1.0s on exit) so
 * the dissolve breathes rather than snaps.
 */
export const ONBOARDING_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.88 }] },
  40: { opacity: 0.55, transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(1300);

export const ONBOARDING_EXIT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  60: { opacity: 0.3, transform: [{ scale: 0.94 }] },
  100: { opacity: 0, transform: [{ scale: 0.88 }] },
}).duration(1000);
