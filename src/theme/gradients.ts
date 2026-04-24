import { colors } from './colors';

export const gradients = {
  nightSky: {
    colors: [colors.night.top, colors.night.mid, colors.night.bottom] as [
      string,
      string,
      string,
    ],
    locations: [0, 0.55, 1] as [number, number, number],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  cardBorder: {
    colors: [
      colors.night.cardEdge,
      'rgba(31, 46, 102, 0.35)',
      'rgba(31, 46, 102, 0.08)',
    ] as [string, string, string],
    locations: [0, 0.5, 1] as [number, number, number],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export type Gradient = keyof typeof gradients;
