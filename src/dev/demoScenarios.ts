import { Baby } from '@/logic/age';
import { SleepSession } from '@/logic/recommendation';
import { CareEvent } from '@/logic/careEvents';

// ---------------------------------------------------------------------------
// Time helpers — all computed at call time so scenarios always have fresh dates
// ---------------------------------------------------------------------------

const hoursAgo = (h: number): string =>
  new Date(Date.now() - h * 3_600_000).toISOString();

/** Calendar day N days ago at a specific hour (0-23). */
const daysAgoAt = (days: number, hour: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const dobMonthsAgo = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
};

const dobDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const dobYearsAgo = (years: number): string => dobMonthsAgo(years * 12);

let _counter = 0;
const uid = () => `demo-${++_counter}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const DEMO_BABY_ID = 'demo-baby-1';

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  build: () => { baby: Baby; sessions: SleepSession[]; events: CareEvent[] };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'newborn-empty',
    label: '👶  Recién nacido sin datos',
    description: 'STAND_BY · sin sesiones ni eventos',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobDaysAgo(15) },
      sessions: [],
      events: [],
    }),
  },
  {
    id: '3m-morning-wake',
    label: '🌅  3 meses · solo despertar matutino',
    description: 'UPCOMING/NOW · primera siesta pendiente',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(3) },
      sessions: [],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(2) }],
    }),
  },
  {
    id: '6m-active-nap',
    label: '😴  6 meses · siesta activa',
    description: 'SLEEPING · sesión en curso',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(6) },
      sessions: [
        { id: uid(), kind: 'nap', startedAt: hoursAgo(0.5), endedAt: null },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 20),
          endedAt: daysAgoAt(0, 7),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(3) }],
    }),
  },
  {
    id: '9m-wake-window-now',
    label: '⏰  9 meses · ventana vigilia activa',
    description: 'NOW · siesta debería haber empezado',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(9) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(5),
          endedAt: hoursAgo(3.5),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 20),
          endedAt: daysAgoAt(0, 7),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(7) }],
    }),
  },
  {
    id: '12m-overdue-nap',
    label: '⚠️  12 meses · siesta muy retrasada',
    description: 'NOW overdue · ventana expirada hace horas',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(12) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(7),
          endedAt: hoursAgo(6),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 19),
          endedAt: daysAgoAt(0, 6),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(8) }],
    }),
  },
  {
    id: '18m-bedtime-soon',
    label: '🌙  18 meses · hora de dormir próxima',
    description: 'UPCOMING night · mejor por la tarde-noche',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(18) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(6),
          endedAt: hoursAgo(5),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 19),
          endedAt: daysAgoAt(0, 7),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(11) }],
    }),
  },
  {
    id: '24m-past-bedtime',
    label: '🌑  24 meses · pasada hora de dormir',
    description: 'NOW bedtime · mejor a última hora del día',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(24) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(9),
          endedAt: hoursAgo(8),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 20),
          endedAt: daysAgoAt(0, 7),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(13) }],
    }),
  },
  {
    id: '3y-short-naps',
    label: '📊  3 años · siestas cortas',
    description: 'shortNapsWarn · 2 siestas < 30 min',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobYearsAgo(3) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(7),
          endedAt: hoursAgo(6.6),
        },
        {
          id: uid(),
          kind: 'nap',
          startedAt: hoursAgo(5),
          endedAt: hoursAgo(4.6),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 20),
          endedAt: daysAgoAt(0, 7),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: hoursAgo(9) }],
    }),
  },
  {
    id: '12m-empty-today',
    label: '📅  Sin datos hoy (solo ayer)',
    description: 'Empty state · navega a ayer para ver datos',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(12) },
      sessions: [
        {
          id: uid(),
          kind: 'nap',
          startedAt: daysAgoAt(1, 13),
          endedAt: daysAgoAt(1, 14),
        },
        {
          id: uid(),
          kind: 'night',
          startedAt: daysAgoAt(1, 20),
          endedAt: daysAgoAt(1, 21),
        },
      ],
      events: [{ id: uid(), kind: 'morningWake', at: daysAgoAt(1, 7) }],
    }),
  },
  {
    id: '9m-restless-night',
    label: '😰  9 meses · noche inquieta',
    description: 'contextRestlessNight · 3 despertares nocturnos',
    build: () => ({
      baby: { id: DEMO_BABY_ID, name: 'Demo', dateOfBirth: dobMonthsAgo(9) },
      sessions: [
        {
          id: uid(),
          kind: 'night',
          startedAt: hoursAgo(12),
          endedAt: hoursAgo(2),
        },
      ],
      events: [
        { id: uid(), kind: 'morningWake', at: hoursAgo(2) },
        { id: uid(), kind: 'nightWake', at: hoursAgo(10), endedAt: hoursAgo(9.5) },
        { id: uid(), kind: 'nightWake', at: hoursAgo(7), endedAt: hoursAgo(6.5) },
        { id: uid(), kind: 'nightWake', at: hoursAgo(4), endedAt: hoursAgo(3.7) },
      ],
    }),
  },
];

export const getScenario = (id: string): DemoScenario | undefined =>
  DEMO_SCENARIOS.find((s) => s.id === id);
