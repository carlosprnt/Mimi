export type MoonPhase =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

const SYNODIC_MONTH = 29.530588853;
// A known new moon: 2000-01-06 18:14 UTC.
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  const days = (date.getTime() - REF_NEW_MOON_MS) / MS_PER_DAY;
  let phase = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (phase < 0) phase += 1;
  if (phase < 0.0625) return 'new';
  if (phase < 0.1875) return 'waxingCrescent';
  if (phase < 0.3125) return 'firstQuarter';
  if (phase < 0.4375) return 'waxingGibbous';
  if (phase < 0.5625) return 'full';
  if (phase < 0.6875) return 'waningGibbous';
  if (phase < 0.8125) return 'lastQuarter';
  if (phase < 0.9375) return 'waningCrescent';
  return 'new';
}

export const MOON_PHASE_GLYPH: Record<MoonPhase, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
};

export const moonGlyphForDate = (date: Date = new Date()): string =>
  MOON_PHASE_GLYPH[getMoonPhase(date)];
