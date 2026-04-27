export const colors = {
  bg: {
    base: '#0E0F12',
    elevated: '#16181D',
    sunken: '#0A0B0E',
    overlay: 'rgba(6, 7, 10, 0.72)',
  },
  night: {
    top: '#14235A',
    mid: '#080F2A',
    bottom: '#020410',
    card: '#131B3A',
    cardEdge: '#1F2E66',
  },
  border: {
    hairline: '#1E2128',
    strong: '#2A2D35',
  },
  text: {
    primary: '#F4F2FC',
    secondary: '#CCC8E8',
    tertiary: '#A4A1C9',
    onAccent: '#0E0F12',
  },
  accent: {
    base: '#A8A5E6',
    pressed: '#918EDC',
    soft: 'rgba(168, 165, 230, 0.14)',
    glow: 'rgba(168, 165, 230, 0.22)',
  },
  warn: {
    soft: '#D9B382',
  },
  danger: {
    base: '#E26B62',
    soft: 'rgba(226, 107, 98, 0.14)',
    border: 'rgba(226, 107, 98, 0.42)',
  },
  success: {
    base: '#6FCE8C',
    soft: 'rgba(111, 206, 140, 0.18)',
    border: 'rgba(111, 206, 140, 0.42)',
  },
  pure: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

export type Colors = typeof colors;
