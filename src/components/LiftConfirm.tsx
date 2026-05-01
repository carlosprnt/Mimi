import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Button } from './Button';
import { screenGutter, spacing } from '@/theme';
import { t } from '@/i18n';

const SCENE_LIFT = 280;
const SCENE_SCALE = 0.95;
const ANIM_OPEN = 380;
const ANIM_CLOSE = 260;

interface LiftConfirmProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  /** Label of the primary destructive CTA (rendered first). */
  destructiveLabel: string;
  /** Label of the secondary cancel link rendered below. Defaults to
   *  the localised "Cancelar". */
  cancelLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a screen and provides a "lift to confirm" interaction:
 *  - The scene (header + body) translates up and scales to 0.95 with
 *    a hairline inset stroke fading in over it.
 *  - A confirmation panel slides up from below, ~40px under the
 *    lifted scene, exposing a destructive CTA followed by a Cancel
 *    link.
 *  - Tapping the lifted scene, dragging it down, or pressing Cancel
 *    closes the panel.
 *
 * The same component drives delete-account, sign-out, and delete-baby
 * flows so they share an identical visual rhythm.
 */
export const LiftConfirm: React.FC<LiftConfirmProps> = ({
  open,
  onClose,
  title,
  body,
  destructiveLabel,
  cancelLabel,
  onConfirm,
  busy,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const slide = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(open ? 1 : 0, {
      duration: open ? ANIM_OPEN : ANIM_CLOSE,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, [open, slide]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [0, -SCENE_LIFT],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          slide.value,
          [0, 1],
          [1, SCENE_SCALE],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const sceneOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      slide.value,
      [0, 0.5, 1],
      [0, 0.3, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [40, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Drag the lifted scene down (anywhere) to dismiss. activeOffsetY(15)
  // lets short jitters pass through so taps still register.
  const dismissGesture = Gesture.Pan()
    .enabled(open)
    .activeOffsetY(15)
    .failOffsetX([-25, 25])
    .onEnd((e) => {
      if (e.translationY > 0) runOnJS(onClose)();
    });

  return (
    <View style={styles.root}>
      <GestureDetector gesture={dismissGesture}>
        <Animated.View style={[styles.scene, sceneStyle]}>
          {children}
          <Animated.View
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              StyleSheet.absoluteFillObject,
              styles.sceneOverlay,
              sceneOverlayStyle,
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          panelStyle,
        ]}
      >
        <Text variant="title" align="center" style={styles.panelTitle}>
          {title}
        </Text>
        {body ? (
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.panelBody}
          >
            {body}
          </Text>
        ) : null}
        <Button
          title={destructiveLabel}
          variant="destructive"
          onPress={onConfirm}
          loading={busy}
        />
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.cancelLink,
            pressed && styles.cancelLinkPressed,
          ]}
        >
          <Text variant="footnote" tone="secondary">
            {cancelLabel ?? t('profile.cancel')}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scene: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  sceneOverlay: {
    backgroundColor: 'rgba(7, 11, 31, 0.18)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
  },
  panelTitle: {
    marginBottom: spacing.sm,
  },
  panelBody: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelLinkPressed: {
    opacity: 0.6,
  },
});
