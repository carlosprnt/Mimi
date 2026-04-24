export type CareEventKind = 'feeding' | 'diaper' | 'nightWake';

export interface CareEvent {
  id: string;
  at: string;
  kind: CareEventKind;
}
