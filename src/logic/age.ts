const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.4375;

export interface Baby {
  id: string;
  name: string;
  dateOfBirth: string;
  prematureWeeks?: number;
}

export function ageInMonths(baby: Baby, now = new Date()): number {
  const dob = new Date(baby.dateOfBirth).getTime();
  const correction = (baby.prematureWeeks ?? 0) * 7 * MS_PER_DAY;
  const days = (now.getTime() - dob - correction) / MS_PER_DAY;
  return Math.max(0, days / DAYS_PER_MONTH);
}

export function ageLabel(baby: Baby, now = new Date()): string {
  const months = ageInMonths(baby, now);
  if (months < 1) {
    const days = Math.floor(months * DAYS_PER_MONTH);
    return days <= 1 ? 'Newborn' : `${days} days`;
  }
  const rounded = Math.round(months * 10) / 10;
  if (rounded < 2) {
    return `${rounded.toFixed(1)} months`;
  }
  return `${Math.round(months)} months`;
}
