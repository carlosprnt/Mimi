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
}

const PLOT_HEIGHT = 140;

export const BarChart: React.FC<BarChartProps> = ({
  values,
  labels,
  height = PLOT_HEIGHT,
  formatValue,
  tint = colors.accent.base,
  yMax,
}) => {
  const computedMax = yMax ?? Math.max(1, ...values);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {values.map((v, i) => {
          const ratio = computedMax > 0 ? v / computedMax : 0;
          const barH = Math.max(2, ratio * (height - 14));
          return (
            <View key={i} style={styles.column}>
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
      </View>

      <View style={styles.labels}>
        {labels.map((l, i) => (
          <View key={i} style={styles.column}>
            <Text variant="footnote" tone="tertiary" style={styles.tick}>
              {l}
            </Text>
            {formatValue && values[i] > 0 ? (
              <Text variant="footnote" tone="secondary" style={styles.value}>
                {formatValue(values[i])}
              </Text>
            ) : null}
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
