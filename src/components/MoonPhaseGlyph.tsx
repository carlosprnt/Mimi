import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { moonGlyphForDate } from '@/logic/moonPhase';

interface MoonPhaseGlyphProps {
  size?: number;
  date?: Date;
}

export const MoonPhaseGlyph: React.FC<MoonPhaseGlyphProps> = ({
  size = 26,
  date,
}) => {
  return (
    <Text
      style={[styles.glyph, { fontSize: size, lineHeight: size * 1.1 }]}
      allowFontScaling={false}
    >
      {moonGlyphForDate(date)}
    </Text>
  );
};

const styles = StyleSheet.create({
  glyph: {
    textAlign: 'center',
  },
});
