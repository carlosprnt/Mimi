import { Easing } from 'react-native';

export const motion = {
  duration: {
    fast: 160,
    base: 220,
    slow: 320,
  },
  easing: {
    standard: Easing.bezier(0.22, 1, 0.36, 1),
    exit: Easing.bezier(0.4, 0, 1, 1),
  },
  spring: {
    sheet: { damping: 22, stiffness: 240, mass: 1 },
    soft: { damping: 18, stiffness: 180, mass: 1 },
  },
} as const;
