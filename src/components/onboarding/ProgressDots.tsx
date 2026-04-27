import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
}) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i === current ? 'active' : i < current ? 'done' : 'pending';
        return (
          <View
            key={i}
            style={[
              styles.dot,
              state === 'active' && styles.dotActive,
              state === 'done' && styles.dotDone,
              state === 'pending' && styles.dotPending,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  dotDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  dotPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
