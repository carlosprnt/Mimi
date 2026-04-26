import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
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
}

const iconFor = (kind: TimelineKind): keyof typeof Ionicons.glyphMap => {
  switch (kind) {
    case 'wake':
      return 'sunny';
    case 'bedtime':
      return 'moon';
    case 'nap':
      return 'bed';
    case 'feeding':
      return 'water';
    case 'diaper':
      return 'reload';
    case 'nightWake':
      return 'flash';
  }
};

const labelFor = (kind: TimelineKind): string => {
  switch (kind) {
    case 'wake':
      return t('timeline.wake');
    case 'bedtime':
      return t('timeline.bedtime');
    case 'nap':
      return t('timeline.nap');
    case 'feeding':
      return t('timeline.feeding');
    case 'diaper':
      return t('timeline.diaper');
    case 'nightWake':
      return t('timeline.nightWake');
  }
};

const formatEventTime = (event: TimelineEvent, use24h: boolean): string => {
  if (event.at) return formatClock(event.at, use24h);
  if (event.from && event.to) {
    return `${formatClock(event.from, use24h)} – ${formatClock(event.to, use24h)}`;
  }
  if (event.from) return formatClock(event.from, use24h);
  return '';
};

const formatCaption = (
  event: TimelineEvent,
  use24h: boolean,
  now: Date,
): string | null => {
  if (event.captionKey === 'yesterday') return t('date.yesterday');
  if (event.status === 'active' && event.from) {
    const elapsed = now.getTime() - event.from.getTime();
    return `${t('timeline.inProgress')} · ${formatDuration(elapsed)}`;
  }
  if (event.status === 'real' && event.durationMs != null) {
    return formatDuration(event.durationMs);
  }
  if (event.status === 'suggested') {
    return t('timeline.suggested');
  }
  return null;
};

const dotColors = (status: TimelineStatus) => {
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
  return {
    background: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.2)',
    icon: colors.text.tertiary,
  };
};

const RAIL_WIDTH = 36;
const DOT_SIZE = 28;
const GLOW_SIZE = 64;
const DASH_HEIGHT = 4;
const DASH_COUNT = 5;
const OVERNIGHT_OPACITY = 0.5;

const SolidLine: React.FC<{
  hidden?: boolean;
  variant?: 'normal' | 'overnight' | 'suggested';
}> = ({ hidden, variant = 'normal' }) => {
  if (hidden) return <View style={styles.lineSpacer} />;
  if (variant === 'suggested') {
    return (
      <View style={styles.dashWrap}>
        {Array.from({ length: DASH_COUNT }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>
    );
  }
  return (
    <View
      style={[
        styles.line,
        variant === 'overnight' && styles.lineOvernight,
      ]}
    />
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

export const Timeline: React.FC<TimelineProps> = ({
  events,
  use24h = true,
  now = new Date(),
  onPressEvent,
}) => {
  const nextMilestoneIndex = events.findIndex(
    (e) => e.status === 'suggested' || e.status === 'active',
  );

  return (
    <View style={styles.wrap}>
      {events.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === events.length - 1;
        const dc = dotColors(event.status);
        const timeText = formatEventTime(event, use24h);
        const caption = formatCaption(event, use24h, now);
        const editable =
          onPressEvent !== undefined &&
          ((event.status === 'real' &&
            (event.kind === 'wake' ||
              event.kind === 'nap' ||
              event.kind === 'feeding' ||
              event.kind === 'diaper' ||
              event.kind === 'nightWake')) ||
            (event.status === 'active' && !!event.sessionId));

        const prev = events[index - 1];
        const next = events[index + 1];
        const aboveOvernight =
          !!prev && !!event.overnightChain && !!prev.overnightChain;
        const belowOvernight =
          !!next && !!event.overnightChain && !!next.overnightChain;
        const aboveSuggested =
          !!prev &&
          (event.status === 'suggested' || prev.status === 'suggested');
        const belowSuggested =
          !!next &&
          (event.status === 'suggested' || next.status === 'suggested');

        const isNext = index === nextMilestoneIndex;
        const dimRow = !!event.overnightChain && event.kind !== 'wake';
        const rowOpacity = dimRow ? OVERNIGHT_OPACITY : 1;

        const row = (
          <>
            <View style={styles.rail}>
              <SolidLine
                hidden={isFirst}
                variant={
                  aboveSuggested
                    ? 'suggested'
                    : aboveOvernight
                      ? 'overnight'
                      : 'normal'
                }
              />
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
                    name={iconFor(event.kind)}
                    size={14}
                    color={isNext ? colors.pure.white : dc.icon}
                  />
                </View>
              </View>
              <SolidLine
                hidden={isLast}
                variant={
                  belowSuggested
                    ? 'suggested'
                    : belowOvernight
                      ? 'overnight'
                      : 'normal'
                }
              />
            </View>

            <View style={[styles.content, { opacity: rowOpacity }]}>
              <View style={styles.titleRow}>
                <Text
                  variant="body"
                  tone={event.status === 'suggested' ? 'secondary' : 'primary'}
                  style={styles.title}
                >
                  {labelFor(event.kind)}
                </Text>
                <Text
                  variant="body"
                  tone={event.status === 'suggested' ? 'secondary' : 'primary'}
                  tabular
                >
                  {timeText}
                </Text>
              </View>
              {caption ? (
                <Text variant="footnote" tone="tertiary" style={styles.caption}>
                  {caption}
                </Text>
              ) : null}
            </View>
          </>
        );

        if (editable) {
          return (
            <Pressable
              key={event.id}
              onPress={() => onPressEvent(event)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.pressed,
              ]}
            >
              {row}
            </Pressable>
          );
        }

        return (
          <View key={event.id} style={styles.row}>
            {row}
          </View>
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
    minHeight: 60,
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
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    flex: 1,
  },
  caption: {
    marginTop: 2,
  },
  pressed: {
    opacity: 0.5,
  },
});
