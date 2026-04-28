import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';

export interface RangeBar {
  /** Lower bound of the range (e.g. earliest wake hour, in float h). */
  min: number;
  /** Upper bound. */
  max: number;
  /** Optional middle marker (mean). */
  mean?: number;
}

interface RangeBarChartProps {
  /** One entry per bar; null when there's no data for that bar. */
  ranges: Array<RangeBar | null>;
  labels: string[];
  yMin: number;
  yMax: number;
  height?: number;
  tint?: string;
  /** Map a y-axis value to its tick label, e.g. (h) => `${h % 24}:00`. */
  formatTick?: (y: number) => string;
  /** Fixed column width — used inside a horizontal ScrollView. */
  cellWidth?: number;
}

const PLOT_HEIGHT = 160;

export const RangeBarChart: React.FC<RangeBarChartProps> = ({
  ranges,
  labels,
  yMin,
  yMax,
  height = PLOT_HEIGHT,
  tint = colors.accent.base,
  formatTick,
  cellWidth,
}) => {
  const span = Math.max(1, yMax - yMin);
  const colStyle = cellWidth
    ? [styles.columnFixed, { width: cellWidth }]
    : styles.column;

  const yToPx = (y: number): number => {
    const ratio = (y - yMin) / span;
    return (1 - ratio) * (height - 12) + 6;
  };

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {ranges.map((r, i) => {
          if (!r) {
            return <View key={i} style={colStyle} />;
          }
          const top = yToPx(r.max);
          const bottom = yToPx(r.min);
          const meanY = r.mean !== undefined ? yToPx(r.mean) : null;
          return (
            <View key={i} style={colStyle}>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.fill,
                    {
                      top,
                      height: Math.max(2, bottom - top),
                      backgroundColor: tint,
                    },
                  ]}
                />
                {meanY !== null ? (
                  <View
                    style={[
                      styles.meanDot,
                      {
                        top: meanY - 3,
                        backgroundColor: tint,
                      },
                    ]}
                  />
                ) : null}
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
      {formatTick ? (
        <Text variant="footnote" tone="tertiary" style={styles.range}>
          {formatTick(yMax)} – {formatTick(yMin)}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnFixed: {
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: '40%',
    right: '40%',
    borderRadius: 3,
  },
  meanDot: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
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
  range: {
    marginTop: spacing.xs,
    textAlign: 'right',
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
