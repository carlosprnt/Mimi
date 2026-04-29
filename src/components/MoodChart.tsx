import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, fonts, spacing } from '@/theme';

export type Mood = 'great' | 'good' | 'rough' | 'none';

interface Props {
  moods: Mood[];
  labels: string[];
  cellWidth?: number;
}

const moodIcon = (m: Mood): { name: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; color: string } => {
  switch (m) {
    case 'great':
      return { name: 'happy', color: colors.success.base };
    case 'good':
      return { name: 'happy-outline', color: colors.accent.base };
    case 'rough':
      return { name: 'sad-outline', color: colors.danger.base };
    case 'none':
    default:
      return { name: 'remove', color: colors.text.tertiary };
  }
};

export const MoodChart: React.FC<Props> = ({ moods, labels, cellWidth }) => {
  const colStyle = cellWidth
    ? [styles.columnFixed, { width: cellWidth }]
    : styles.column;

  return (
    <View>
      <View style={styles.row}>
        {moods.map((m, i) => {
          const { name, color } = moodIcon(m);
          return (
            <View key={i} style={colStyle}>
              <Ionicons name={name} size={26} color={color} />
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
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnFixed: {
    alignItems: 'center',
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
