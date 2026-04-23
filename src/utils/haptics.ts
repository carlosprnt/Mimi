import * as Haptics from 'expo-haptics';

export function softImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
}

export function lightImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selection() {
  Haptics.selectionAsync().catch(() => {});
}
