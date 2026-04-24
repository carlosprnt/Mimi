import { TextStyle } from 'react-native';

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fonts.medium,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  callout: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  wordmark: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 2.4,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
