import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { Text } from './Text';
import {
  TimelineEvent,
  TimelineKind,
  TimelineStatus,
} from '@/logic/timeline';
import { formatClock, formatDuration } from '@/logic/format';
import { t } from '@/i18n';

interface TimelineProps {
  events: TimelineEvent[];
  use24h?: boolean;
  now?: Date;
  onPressEvent?: (event: TimelineEvent) => void;
  /** When true, the previous-night portion (everything before the
   *  morning wake) is hidden. Controlled by HomeScreen via the
   *  "Ver / Ocultar noche anterior" toggle on the plan card header. */
  hidePreviousNight?: boolean;
}

const iconFor = (
  kind: TimelineKind,
  status: TimelineStatus,
): keyof typeof Ionicons.glyphMap => {
  const isOutline = status === 'suggested';
  switch (kind) {
    case 'wake':
      return isOutline ? 'sunny-outline' : 'sunny';
    case 'bedtime':
      return isOutline ? 'moon-outline' : 'moon';
    case 'nap':
      return isOutline ? 'bed-outline' : 'bed';
    case 'feeding':
      return isOutline ? 'water-outline' : 'water';
    case 'diaper':
      return 'reload';
    case 'nightWake':
      return 'flash';
  }
};

const labelFor = (
  kind: TimelineKind,
  segment?: 'start' | 'resumed',
  overnightChain?: boolean,
  microNap?: boolean,
): string => {
  switch (kind) {
    case 'wake':
      return t('timeline.wake');
    case 'bedtime':
      if (segment === 'start') return t('timeline.bedtimeStart');
      return t('timeline.bedtime');
    case 'nap':
      return microNap ? t('timeline.microNap') : t('timeline.nap');
    case 'feeding':
      return t('timeline.feeding');
    case 'diaper':
      return t('timeline.diaper');
    case 'nightWake':
      // Only call it "Despertar nocturno" when the wake actually
      // happened during a night sleep. Wake interruptions outside the
      // overnight chain (e.g. during a nap) read as plain "Despertar".
      return overnightChain
        ? t('timeline.nightWake')
        : t('timeline.wake');
  }
};

const formatSubtitle = (
  event: TimelineEvent,
  use24h: boolean,
): string | null => {
  if (event.captionKey === 'yesterday') {
    if (event.at) {
      return `${t('date.yesterday')} · ${formatClock(event.at, use24h)}`;
    }
    return t('date.yesterday');
  }
  if (event.captionKey === 'noNightData') {
    return t('timeline.morningWakeNoNight');
  }
  if (event.status === 'active' && event.from) {
    return t('timeline.activeFromTime', {
      time: formatClock(event.from, use24h),
    });
  }
  if (event.from && event.to) {
    return `${formatClock(event.from, use24h)} – ${formatClock(event.to, use24h)}`;
  }
  if (event.at) return formatClock(event.at, use24h);
  if (event.from) return formatClock(event.from, use24h);
  return null;
};

const formatRightDuration = (
  event: TimelineEvent,
  now: Date,
): string | null => {
  if (event.status === 'active' && event.from) {
    return formatDuration(now.getTime() - event.from.getTime());
  }
  if (event.kind === 'nightWake' && event.durationMs != null) {
    return formatDuration(event.durationMs);
  }
  if (event.status === 'real' && event.durationMs != null) {
    return formatDuration(event.durationMs);
  }
  return null;
};

const formatExtraCaption = (_event: TimelineEvent): string | null => {
  // Microsleeps used to surface a redundant "Microsueño" tag in addition
  // to their title; the title now reads "Microsueño" directly so we
  // suppress the extra caption to keep the row tight.
  return null;
};

const dotColors = (
  status: TimelineStatus,
  kind: TimelineKind,
  confidence?: 'high' | 'low',
) => {
  if (kind === 'nightWake' && status === 'real') {
    return {
      background: 'rgba(226, 107, 98, 0.18)',
      border: colors.danger.base,
      icon: colors.danger.base,
    };
  }
  if (status === 'active') {
    return {
      background: colors.accent.base,
      border: colors.accent.base,
      icon: colors.text.onAccent,
    };
  }
  if (status === 'real') {
    return {
      background: 'rgba(168, 165, 230, 0.2)',
      border: colors.accent.base,
      icon: colors.accent.base,
    };
  }
  // suggested
  if (confidence === 'low') {
    return {
      background: 'rgba(255, 255, 255, 0.025)',
      border: 'rgba(255, 255, 255, 0.12)',
      icon: 'rgba(255, 255, 255, 0.4)',
    };
  }
  return {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.28)',
    icon: colors.text.tertiary,
  };
};

const RAIL_WIDTH = 44;
const DOT_SIZE = 40;
const GLOW_SIZE = 80;
const DASH_HEIGHT = 4;
const DASH_COUNT = 5;
const OVERNIGHT_OPACITY = 0.5;

// Variant priority for a rail segment (highest wins):
//   interrupted > suggested > overnight > normal
type RailVariant = 'normal' | 'overnight' | 'suggested' | 'interrupted';

/** Subtle white "you are here" pulse painted over the rail segment
 *  that contains the current moment (the gap between the last past
 *  event and the next upcoming one). Brightest in the centre and
 *  fading to 0 at both ends so it reads as an internal glow rather
 *  than a hard line. */
const NowGlow: React.FC = () => {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.4, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.nowGlow, animStyle]}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.55)',
          'rgba(255, 255, 255, 0)',
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const SolidLine: React.FC<{
  hidden?: boolean;
  variant?: RailVariant;
  isNow?: boolean;
}> = ({ hidden, variant = 'normal', isNow }) => {
  if (hidden) return <View style={styles.lineSpacer} />;
  if (variant === 'suggested') {
    return (
      <View style={styles.dashWrap}>
        {Array.from({ length: DASH_COUNT }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
        {isNow ? <NowGlow /> : null}
      </View>
    );
  }
  return (
    <View
      style={[
        styles.line,
        variant === 'overnight' && styles.lineOvernight,
        variant === 'interrupted' && styles.lineInterrupted,
      ]}
    >
      {isNow ? <NowGlow /> : null}
    </View>
  );
};

const PulsingGlow: React.FC = () => {
  const opacity = useSharedValue(0.45);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.95, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.45, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.92, {
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.glow, animStyle]}>
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient
            id="dot-glow"
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            rx={GLOW_SIZE / 2}
            ry={GLOW_SIZE / 2}
            fx={GLOW_SIZE / 2}
            fy={GLOW_SIZE / 2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="0.8" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill="url(#dot-glow)"
        />
      </Svg>
    </Animated.View>
  );
};

const eventEndTime = (e: TimelineEvent): Date | null =>
  e.to ?? e.at ?? e.from ?? null;
const eventStartTime = (e: TimelineEvent): Date | null =>
  e.from ?? e.at ?? e.to ?? null;

export const Timeline: React.FC<TimelineProps> = ({
  events,
  use24h = true,
  now = new Date(),
  onPressEvent,
  hidePreviousNight = false,
}) => {
  // The collapse state is owned by HomeScreen (rendered as a tiny
  // text toggle on the plan card header); we just respect it here.
  const morningWakeIdx = events.findIndex(
    (e) => e.kind === 'wake' && e.status === 'real',
  );
  const visibleEvents =
    hidePreviousNight && morningWakeIdx > 0
      ? events.slice(morningWakeIdx)
      : events;
  const nextMilestoneIndex = visibleEvents.findIndex(
    (e) => e.status === 'suggested' || e.status === 'active',
  );

  // Find the rail segment that "contains" the current moment — i.e.
  // the gap between the last past event and the next upcoming one.
  // The line below visibleEvents[nowSegmentIndex] gets the NowGlow
  // overlay. -1 disables the glow.
  const nowSegmentIndex = (() => {
    const t = now.getTime();
    for (let i = 0; i < visibleEvents.length - 1; i++) {
      const cur = visibleEvents[i];
      const nxt = visibleEvents[i + 1];
      const end = eventEndTime(cur);
      const start = eventStartTime(nxt);
      if (!end || !start) continue;
      if (t >= end.getTime() && t < start.getTime()) return i;
    }
    return -1;
  })();

  return (
    <View style={styles.wrap}>
      {visibleEvents.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === visibleEvents.length - 1;

        const isNowSegment = index === nowSegmentIndex;

        // Tappable placeholder rows (e.g. "Añadir datos de la noche",
        // "Añadir despertar nocturno"). Render with a dashed accent dot
        // and an accent label, no time on the right.
        if (event.placeholder) {
          return (
            <Animated.View
              key={event.id}
              entering={FadeIn.delay(index * 50).duration(280)}
            >
              <Pressable
                onPress={() => onPressEvent?.(event)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rail}>
                  <View style={styles.dotContainer}>
                    <View style={[styles.dot, styles.dotPlaceholder]}>
                      <Ionicons
                        name="add"
                        size={16}
                        color={colors.accent.base}
                      />
                    </View>
                  </View>
                  <SolidLine
                    hidden={isLast}
                    variant="overnight"
                    isNow={isNowSegment}
                  />
                </View>
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text variant="body" tone="accent" style={styles.title}>
                      {event.placeholder === 'addBedtime'
                        ? t('timeline.addBedtimeData')
                        : t('timeline.addNightWakePlaceholder')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        }

        const dc = dotColors(event.status, event.kind, event.confidence);
        const subtitle = formatSubtitle(event, use24h);
        const rightDuration = formatRightDuration(event, now);
        const extraCaption = formatExtraCaption(event);
        const editable =
          onPressEvent !== undefined &&
          ((event.status === 'real' &&
            (event.kind === 'wake' ||
              event.kind === 'nap' ||
              event.kind === 'feeding' ||
              event.kind === 'diaper' ||
              event.kind === 'nightWake')) ||
            (event.status === 'active' && !!event.sessionId) ||
            event.status === 'suggested');

        const prev = visibleEvents[index - 1];
        const next = visibleEvents[index + 1];
        const aboveOvernight =
          !!prev && !!event.overnightChain && !!prev.overnightChain;
        const belowOvernight =
          !!next && !!event.overnightChain && !!next.overnightChain;
        // Dashed only when BOTH ends of the segment are suggested.
        // The line from a real anchor into the next prediction stays solid
        // so the eye can follow "you are here → next" without breaking.
        const aboveSuggested =
          !!prev &&
          event.status === 'suggested' &&
          prev.status === 'suggested';
        const belowSuggested =
          !!next &&
          event.status === 'suggested' &&
          next.status === 'suggested';
        // Night-wake interruption: red rail above + below the dot, only
        // within this row. Adjacent rows return to violet immediately.
        const isInterruption =
          event.kind === 'nightWake' && event.status === 'real';

        const railVariant = (
          interrupted: boolean,
          suggested: boolean,
          overnight: boolean,
        ): RailVariant =>
          interrupted
            ? 'interrupted'
            : suggested
              ? 'suggested'
              : overnight
                ? 'overnight'
                : 'normal';

        const isNext = index === nextMilestoneIndex;
        const dimRow = !!event.overnightChain && event.kind !== 'wake';
        const rowOpacity = dimRow ? OVERNIGHT_OPACITY : 1;

        const row = (
          <>
            <View style={styles.rail}>
              <View style={styles.dotContainer}>
                {isNext ? <PulsingGlow /> : null}
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isNext ? 'transparent' : dc.background,
                      borderColor: dc.border,
                      opacity: rowOpacity,
                    },
                  ]}
                >
                  {isNext ? (
                    <>
                      <BlurView
                        intensity={Platform.OS === 'ios' ? 30 : 18}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                      />
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          { backgroundColor: 'rgba(11, 20, 54, 0.6)' },
                        ]}
                      />
                    </>
                  ) : null}
                  <Ionicons
                    name={
                      isInterruption
                        ? 'flash'
                        : iconFor(event.kind, event.status)
                    }
                    size={20}
                    color={
                      isInterruption
                        ? colors.danger.base
                        : isNext
                          ? colors.pure.white
                          : dc.icon
                    }
                  />
                </View>
              </View>
              <SolidLine
                hidden={isLast}
                variant={railVariant(
                  isInterruption,
                  belowSuggested,
                  belowOvernight,
                )}
                isNow={isNowSegment}
              />
            </View>

            <View style={[styles.content, { opacity: rowOpacity }]}>
              <View style={styles.titleRow}>
                <Text
                  variant="body"
                  tone={
                    event.status === 'suggested'
                      ? event.confidence === 'low'
                        ? 'tertiary'
                        : 'secondary'
                      : event.kind === 'nightWake' && event.status === 'real'
                        ? 'danger'
                        : 'primary'
                  }
                  style={styles.title}
                >
                  {labelFor(
                    event.kind,
                    event.segment,
                    event.overnightChain,
                    event.microNap,
                  )}
                </Text>
                {rightDuration ? (
                  <Text
                    variant="body"
                    tone={
                      event.kind === 'nightWake' && event.status === 'real'
                        ? 'danger'
                        : 'primary'
                    }
                    tabular
                  >
                    {rightDuration}
                  </Text>
                ) : null}
              </View>
              {subtitle ? (
                <Text
                  variant="footnote"
                  tone={
                    event.status === 'suggested'
                      ? event.confidence === 'low'
                        ? 'tertiary'
                        : 'secondary'
                      : event.kind === 'nightWake' && event.status === 'real'
                        ? 'danger'
                        : 'tertiary'
                  }
                  tabular
                  style={styles.subtitle}
                >
                  {subtitle}
                </Text>
              ) : null}
              {extraCaption ? (
                <Text
                  variant="footnote"
                  tone="tertiary"
                  style={styles.caption}
                >
                  {extraCaption}
                </Text>
              ) : null}
            </View>
          </>
        );

        if (editable) {
          return (
            <Animated.View
              key={event.id}
              entering={FadeIn.delay(index * 50).duration(280)}
            >
              <Pressable
                onPress={() => onPressEvent(event)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.pressed,
                ]}
              >
                {row}
              </Pressable>
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={event.id}
            entering={FadeIn.delay(index * 50).duration(280)}
            style={styles.row}
          >
            {row}
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    minHeight: 80,
  },
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(168, 165, 230, 0.5)',
  },
  lineOvernight: {
    backgroundColor: 'rgba(168, 165, 230, 0.22)',
  },
  lineInterrupted: {
    backgroundColor: 'rgba(226, 107, 98, 0.7)',
  },
  lineSpacer: {
    flex: 1,
  },
  dashWrap: {
    flex: 1,
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  dash: {
    width: 2,
    height: DASH_HEIGHT,
    backgroundColor: 'rgba(168, 165, 230, 0.5)',
    borderRadius: 1,
  },
  dotContainer: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    top: -(GLOW_SIZE - DOT_SIZE) / 2,
    left: -(GLOW_SIZE - DOT_SIZE) / 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dotPlaceholder: {
    backgroundColor: 'transparent',
    borderColor: colors.accent.base,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    height: DOT_SIZE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  caption: {
    marginTop: 2,
  },
  pressed: {
    opacity: 0.5,
  },
  nowGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -3,
    right: -3,
    overflow: 'hidden',
  },
});
