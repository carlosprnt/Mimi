import {
  lightImpact,
  mediumImpact,
  heavyImpact,
  selection,
  successNotice,
  warningNotice,
  errorNotice,
} from '@/utils/haptics';

/**
 * Convenience facade re-exporting the haptics utilities used across
 * the app under a single object so call sites read like
 * `haptics.light()`, `haptics.success()`, etc.
 */
export const haptics = {
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  selection,
  success: successNotice,
  warning: warningNotice,
  error: errorNotice,
};
