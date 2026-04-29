import * as Haptics from 'expo-haptics';

/** Soft impact — barely-there tap, used at the start of long actions. */
export function softImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
}

/** Subtle tap — secondary buttons, opening sheets, toggles. */
export function lightImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Stronger tap — primary CTAs, big actions. */
export function mediumImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Big thump — typically reserved for warnings / heavy confirmations. */
export function heavyImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** Tick — pickers, list selections, range toggles. */
export function selection() {
  Haptics.selectionAsync().catch(() => {});
}

/** Three-tap success notification. */
export function successNotice() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

/** Notification warning — destructive actions. */
export function warningNotice() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {},
  );
}

/** Notification error. */
export function errorNotice() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {},
  );
}
