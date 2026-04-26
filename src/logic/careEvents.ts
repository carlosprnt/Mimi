export type CareEventKind =
  | 'feeding'
  | 'diaper'
  | 'nightWake'
  | 'morningWake';

export interface CareEvent {
  id: string;
  at: string;
  kind: CareEventKind;
  /** When the event has a duration (e.g. nightWake), the time the parent
   *  considered the event ended. `undefined` means point-in-time event. */
  endedAt?: string;
}
