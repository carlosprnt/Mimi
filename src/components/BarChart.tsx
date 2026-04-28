import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';

interface BarChartProps {
  /** Numeric data per bar. */
  values: number[];
  /** Tick label below each bar. */
  labels: string[];
  /** Height of the plot area. */
  height?: number;
  /** Optional formatter for the bar's hover/peak label (top of the bar). */
  formatValue?: (n: number) => string;
  /** Tint for the bars. Defaults to accent. */
  tint?: string;
  /** Force a maximum on the Y axis. Useful when comparing two charts. */
  yMax?: number;
  /** When set, columns use this fixed width instead of flexing. Lets
   *  the chart be wider than its container and live inside a
   *  horizontal ScrollView. */
  cellWidth?: number;
  /** When set, draws a horizontal dotted line across the plot at this
   *  Y value to mark the mean. Hidden when 0 or undefined. */
  meanValue?: number;
}

const PLOT_HEIGHT = 140;
const MEAN_DOT_W = 3;
const MEAN_DOT_H = 0.5;
const MEAN_DOT_GAP = 4;
const MEAN_LINE_COLOR = 'rgba(255,255,255,0.55)';

export const BarChart: React.FC<BarChartProps> = ({
  values,
  labels,
  height = PLOT_HEIGHT,
  formatValue,
  tint = colors.accent.base,
  yMax,
  cellWidth,
  meanValue,
}) => {
  const computedMax = yMax ?? Math.max(1, ...values);
  const colStyle = cellWidth
    ? [styles.columnFixed, { width: cellWidth }]
    : styles.column;

  const meanRatio =
    meanValue !== undefined && meanValue > 0 && computedMax > 0
      ? Math.min(1, meanValue / computedMax)
      : null;
  const meanBottom =
    meanRatio !== null ? meanRatio * (height - 14) : null;

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {values.map((v, i) => {
          const ratio = computedMax > 0 ? v / computedMax : 0;
          const barH = Math.max(2, ratio * (height - 14));
          return (
            <View key={i} style={colStyle}>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.fill,
                    {
                      height: barH,
                      backgroundColor: tint,
                      opacity: v === 0 ? 0.18 : 1,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
        {meanBottom !== null ? (
          <View
            pointerEvents="none"
            style={[styles.meanLine, { bottom: meanBottom }]}
          >
            <DottedLine />
          </View>
        ) : null}
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
            {formatValue && values[i] > 0 ? (
              <Text
                variant="footnote"
                tone="secondary"
                style={styles.value}
                numberOfLines={1}
              >
                {formatValue(values[i])}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const DOT_COUNT = 260;

const DottedLine: React.FC = () => (
  <View style={styles.dottedRow}>
    {Array.from({ length: DOT_COUNT }).map((_, i) => (
      <View key={i} style={styles.dot} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    position: 'relative',
  },
  meanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: MEAN_DOT_H,
    overflow: 'hidden',
  },
  dottedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MEAN_DOT_GAP,
  },
  dot: {
    width: MEAN_DOT_W,
    height: MEAN_DOT_H,
    backgroundColor: MEAN_LINE_COLOR,
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
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
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
  value: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
});
