import { Platform, TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontLight = Platform.select({
  ios: 'System',
  android: 'sans-serif-light',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: systemFontLight,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '300',
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: systemFont,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: systemFont,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: systemFont,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  callout: {
    fontFamily: systemFont,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  footnote: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  eyebrow: {
    fontFamily: systemFont,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  wordmark: {
    fontFamily: systemFont,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 2.4,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
