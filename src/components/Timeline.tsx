import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
const LINE_DOT_COUNT = 3;

const DottedLine: React.FC<{
  hidden?: boolean;
  faded?: boolean;
}> = ({ hidden, faded }) => {
  if (hidden) return <View style={styles.lineSpacer} />;
  return (
    <View style={styles.line}>
      {Array.from({ length: LINE_DOT_COUNT }).map((_, i) => (
        <View
          key={i}
          style={[styles.lineDot, faded && styles.lineDotFaded]}
        />
      ))}
    </View>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  events,
  use24h = true,
  now = new Date(),
  onPressEvent,
}) => {
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

        const row = (
          <>
            <View style={styles.rail}>
              <DottedLine
                hidden={isFirst}
                faded={event.status === 'suggested'}
              />
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: dc.background,
                    borderColor: dc.border,
                  },
                ]}
              >
                <Ionicons
                  name={iconFor(event.kind)}
                  size={14}
                  color={dc.icon}
                />
              </View>
              <DottedLine
                hidden={isLast}
                faded={event.status === 'suggested'}
              />
            </View>

            <View style={styles.content}>
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
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  lineSpacer: {
    flex: 1,
  },
  lineDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  lineDotFaded: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
