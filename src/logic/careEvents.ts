export type CareEventKind =
  | 'feeding'
  | 'diaper'
  | 'nightWake'
  | 'morningWake';

export interface CareEvent {
  id: string;
  at: string;
  kind: CareEventKind;
}
