import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';

export interface NightWakeBar {
  /** Sleep duration in ms for this night (used for bar height). */
  sleepMs: number;
  /** Wake events expressed as positions inside this bar, 0..1.
   *  0 = top of bar (start of night), 1 = bottom (end of night). */
  wakes: number[];
}

interface Props {
  bars: NightWakeBar[];
  labels: string[];
  height?: number;
  /** Y-axis max in ms. Defaults to the chart's own max. */
  yMaxMs?: number;
  cellWidth?: number;
}

const PLOT_HEIGHT = 140;

export const NightWakeBarChart: React.FC<Props> = ({
  bars,
  labels,
  height = PLOT_HEIGHT,
  yMaxMs,
  cellWidth,
}) => {
  const maxMs = Math.max(1, yMaxMs ?? Math.max(...bars.map((b) => b.sleepMs)));
  const colStyle = cellWidth
    ? [styles.columnFixed, { width: cellWidth }]
    : styles.column;

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {bars.map((b, i) => {
          const ratio = b.sleepMs / maxMs;
          const barH = Math.max(2, ratio * (height - 14));
          return (
            <View key={i} style={colStyle}>
              <View style={styles.barWrap}>
                <View
                  style={[
                    styles.fill,
                    {
                      height: barH,
                      opacity: b.sleepMs === 0 ? 0.18 : 1,
                    },
                  ]}
                >
                  {b.wakes.map((p, idx) => (
                    <View
                      key={idx}
                      style={[styles.wake, { top: `${Math.min(98, p * 100)}%` }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {labels.map((l, i) => (
          <View key={i} style={colStyle}>
            <Text
              variant="footnote"
              tone="tertiary"
              style={styles.tick}
              numberOfLines={1}
            >
              {l}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnFixed: {
    alignItems: 'center',
  },
  barWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    backgroundColor: colors.accent.base,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
  },
  wake: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.danger.base,
  },
  labels: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xs,
  },
  tick: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
