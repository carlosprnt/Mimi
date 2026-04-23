export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export type Radii = typeof radii;
