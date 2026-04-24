import { Baby, ageInMonths } from './age';
import {
  sleepTargetsForAge,
  wakeWindowForAge,
  bedtimeHintForAge,
  SleepTargets,
} from './recommendation';
import { t, type TranslationKey } from '@/i18n';
import { formatShortDuration } from './format';

interface TipBand {
  maxMonths: number;
  keys: TranslationKey[];
}

const TIP_BANDS: TipBand[] = [
  {
    maxMonths: 3,
    keys: [
      'insights.newborn.naps',
      'insights.newborn.wakeWindow',
      'insights.newborn.nightWakings',
      'insights.newborn.daylight',
      'insights.newborn.totalSleep',
    ],
  },
  {
    maxMonths: 6,
    keys: [
      'insights.infant36.naps',
      'insights.infant36.shortNaps',
      'insights.infant36.bedtime',
      'insights.infant36.regression',
      'insights.infant36.wakeWindow',
    ],
  },
  {
    maxMonths: 12,
    keys: [
      'insights.infant612.naps',
      'insights.infant612.nightConsolidates',
      'insights.infant612.routine',
      'insights.infant612.wakeWindow',
      'insights.infant612.totalSleep',
    ],
  },
  {
    maxMonths: 18,
    keys: [
      'insights.toddler1218.napsTransition',
      'insights.toddler1218.wakeWindow',
      'insights.toddler1218.prebedCalm',
      'insights.toddler1218.skipNap',
      'insights.toddler1218.nightSleep',
    ],
  },
  {
    maxMonths: 36,
    keys: [
      'insights.toddler1836.oneNap',
      'insights.toddler1836.bedTransition',
      'insights.toddler1836.nightWakings',
      'insights.toddler1836.routine',
      'insights.toddler1836.totalSleep',
    ],
  },
  {
    maxMonths: 72,
    keys: [
      'insights.preschool.dropNap',
      'insights.preschool.nightSleep',
      'insights.preschool.screens',
      'insights.preschool.roomTemp',
      'insights.preschool.routine',
    ],
  },
];

const pickBand = (months: number): TipBand =>
  TIP_BANDS.find((b) => months < b.maxMonths) ?? TIP_BANDS[TIP_BANDS.length - 1];

export interface InsightTip {
  key: TranslationKey;
  params: Record<string, string | number>;
}

export function pickInsightTip(baby: Baby, seed: number, now: Date): InsightTip {
  const months = ageInMonths(baby, now);
  const band = pickBand(months);
  const key = band.keys[Math.abs(seed) % band.keys.length];
  const targets = sleepTargetsForAge(months);
  const wakeWin = wakeWindowForAge(months);
  const bedtime = bedtimeHintForAge(months);

  return {
    key,
    params: insightParams(baby, targets, wakeWin, bedtime),
  };
}

function insightParams(
  baby: Baby,
  targets: SleepTargets,
  wake: { minMs: number; maxMs: number },
  bedtime: { earliest: number; latest: number },
): Record<string, string | number> {
  return {
    name: baby.name,
    minNaps: targets.napsMin,
    maxNaps: targets.napsMax,
    minHours: targets.totalHoursMin,
    maxHours: targets.totalHoursMax,
    nightMin: targets.nightHoursMin,
    nightMax: targets.nightHoursMax,
    wakeMin: formatShortDuration(wake.minMs),
    wakeMax: formatShortDuration(wake.maxMs),
    bedtimeEarliest: formatHour(bedtime.earliest),
    bedtimeLatest: formatHour(bedtime.latest),
  };
}

function formatHour(frac: number): string {
  const h = Math.floor(frac);
  const m = Math.round((frac - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function resolveInsightTip(tip: InsightTip): string {
  return t(tip.key, tip.params);
}
