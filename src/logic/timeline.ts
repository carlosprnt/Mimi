import { Baby, ageInMonths } from './age';
import { isSameDay, startOfDay } from './format';
import {
  SleepSession,
  wakeWindowForAge,
  expectedNapsForAge,
  bedtimeHintForAge,
  adjustedWakeWindow,
  isMicroNap,
} from './recommendation';
import { CareEvent } from './careEvents';

export type TimelineKind =
  | 'wake'
  | 'nap'
  | 'bedtime'
  | 'feeding'
  | 'diaper'
  | 'nightWake';
export type TimelineStatus = 'real' | 'active' | 'suggested';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  status: TimelineStatus;
  sessionId?: string;
  careEventId?: string;
  at?: Date;
  from?: Date;
  to?: Date;
  durationMs?: number;
  overnightChain?: boolean;
  captionKey?: 'yesterday' | 'noNightData';
  microNap?: boolean;
  /** When set on a `bedtime` row, distinguishes the visual segment:
   *  - 'start'   → "Inicio de sueño nocturno" (anchor at session start)
   *  - 'resumed' → "Sueño nocturno" (continuation after a night wake)
   *  Only applied when the night session has at least one night-wake
   *  event; otherwise a single bedtime row is emitted with no segment. */
  segment?: 'start' | 'resumed';
  /** Tappable placeholder rows that prompt the parent to fill in
   *  missing pieces of the night chain. Rendered with a dashed
   *  accent dot and an accent label, no time on the right. */
  placeholder?: 'addBedtime' | 'addNightWake';
  /** For suggested events: 'high' for the next predicted event, 'low' for
   *  predictions further down the chain (each one inherits its anchor's
   *  uncertainty). */
  confidence?: 'high' | 'low';
}

const TYPICAL_NAP_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const floatToDate = (day: Date, hoursFloat: number): Date => {
  const d = new Date(day);
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  d.setHours(h, m, 0, 0);
  return d;
};

const eventPosition = (event: TimelineEvent): number => {
  if (event.at) return event.at.getTime();
  if (event.from) return event.from.getTime();
  return 0;
};

export function buildTimeline(
  baby: Baby,
  sessions: SleepSession[],
  day: Date = new Date(),
  now: Date = new Date(),
  careEvents: CareEvent[] = [],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const dayStart = startOfDay(day);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + DAY_MS;
  const isToday = isSameDay(day, now);

  const completed = sessions
    .filter((s) => s.endedAt)
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

  const lastNightEndedThatDay = [...completed]
    .reverse()
    .find((s) => {
      if (s.kind !== 'night' || !s.endedAt) return false;
      const endMs = new Date(s.endedAt).getTime();
      return endMs >= dayStartMs && endMs < dayEndMs;
    });

  const usedCareEventIds = new Set<string>();

  // Wake-anchor (morningWake care event) — solo se renderiza si NO hay
  // sesión nocturna real que termine ese día. Es la huella honesta de
  // un despertar registrado sin la noche que lo precedió.
  const morningWakeAnchor =
    !lastNightEndedThatDay
      ? careEvents.find((e) => {
          if (e.kind !== 'morningWake') return false;
          const t = new Date(e.at).getTime();
          return t >= dayStartMs && t < dayEndMs;
        })
      : undefined;

  if (lastNightEndedThatDay) {
    const nightStartMs = new Date(lastNightEndedThatDay.startedAt).getTime();
    const nightEndMs = new Date(lastNightEndedThatDay.endedAt!).getTime();
    const startedYesterday = nightStartMs < dayStartMs;

    const wakesInRange = careEvents
      .filter((ev) => ev.kind === 'nightWake')
      .filter((ev) => {
        const t = new Date(ev.at).getTime();
        return t > nightStartMs && t < nightEndMs;
      })
      .sort(
        (a, b) =>
          new Date(a.at).getTime() - new Date(b.at).getTime(),
      );

    const split = wakesInRange.length > 0;

    // Net night sleep duration: gross span minus the time the baby was
    // awake during recorded night wakes that fell inside this night.
    const grossMs = nightEndMs - nightStartMs;
    const wakeMsTotal = wakesInRange.reduce((acc, ev) => {
      if (!ev.endedAt) return acc;
      const t = new Date(ev.at).getTime();
      const end = new Date(ev.endedAt).getTime();
      return acc + Math.max(0, end - t);
    }, 0);
    const netNightMs = Math.max(0, grossMs - wakeMsTotal);

    events.push({
      id: `prev-bedtime-${lastNightEndedThatDay.id}`,
      kind: 'bedtime',
      status: 'real',
      sessionId: lastNightEndedThatDay.id,
      at: new Date(nightStartMs),
      // The total night sleep lives on the final piece of the night so
      // it sits near the morning wake. For a single-row (un-split)
      // night that's this row; for a split night the duration is set
      // on the last "resumed" segment further down.
      durationMs: split ? undefined : netNightMs,
      overnightChain: true,
      captionKey: startedYesterday ? 'yesterday' : undefined,
      segment: split ? 'start' : undefined,
    });

    let lastBedtimePieceIndex = events.length - 1;
    for (const ev of wakesInRange) {
      const t = new Date(ev.at).getTime();
      events.push({
        id: `care-${ev.id}`,
        kind: 'nightWake',
        status: 'real',
        careEventId: ev.id,
        at: new Date(ev.at),
        to: ev.endedAt ? new Date(ev.endedAt) : undefined,
        durationMs: ev.endedAt
          ? new Date(ev.endedAt).getTime() - t
          : undefined,
        overnightChain: true,
      });
      usedCareEventIds.add(ev.id);

      // After each night wake that has an end time, emit the resumed
      // bedtime continuation. The visual treatment is restful again
      // (violet rail + bedtime icon + "Sueño nocturno" label).
      if (ev.endedAt) {
        const resumedAtMs = new Date(ev.endedAt).getTime();
        if (resumedAtMs < nightEndMs) {
          events.push({
            id: `resumed-${ev.id}`,
            kind: 'bedtime',
            status: 'real',
            sessionId: lastNightEndedThatDay.id,
            at: new Date(resumedAtMs),
            overnightChain: true,
            segment: 'resumed',
          });
          lastBedtimePieceIndex = events.length - 1;
        }
      }
    }

    // Attach the net night-sleep total to the final bedtime piece (the
    // last "resumed" segment if the night had wakes; otherwise the
    // single start row already carries it).
    if (split) {
      events[lastBedtimePieceIndex] = {
        ...events[lastBedtimePieceIndex],
        durationMs: netNightMs,
      };
    }

    events.push({
      id: `wake-${lastNightEndedThatDay.id}`,
      kind: 'wake',
      status: 'real',
      sessionId: lastNightEndedThatDay.id,
      at: new Date(nightEndMs),
      overnightChain: true,
    });
  } else if (morningWakeAnchor) {
    events.push({
      id: `wake-anchor-${morningWakeAnchor.id}`,
      kind: 'wake',
      status: 'real',
      careEventId: morningWakeAnchor.id,
      at: new Date(morningWakeAnchor.at),
    });
    usedCareEventIds.add(morningWakeAnchor.id);
  }

  const dayNaps = completed.filter((s) => {
    if (s.kind !== 'nap' || !s.endedAt) return false;
    const endMs = new Date(s.endedAt).getTime();
    return endMs >= dayStartMs && endMs < dayEndMs;
  });
  for (const nap of dayNaps) {
    const start = new Date(nap.startedAt);
    const end = new Date(nap.endedAt!);
    events.push({
      id: `nap-${nap.id}`,
      kind: 'nap',
      status: 'real',
      sessionId: nap.id,
      from: start,
      to: end,
      durationMs: end.getTime() - start.getTime(),
      microNap: isMicroNap(nap),
    });
  }

  const nightStartedThatDay = completed.find((s) => {
    if (s.kind !== 'night') return false;
    const startMs = new Date(s.startedAt).getTime();
    return startMs >= dayStartMs && startMs < dayEndMs;
  });

  const active = sessions.find((s) => !s.endedAt);

  if (isToday && active) {
    if (active.kind === 'night') {
      const activeStartMs = new Date(active.startedAt).getTime();
      const activeWakes = careEvents
        .filter((ev) => ev.kind === 'nightWake')
        .filter((ev) => {
          const t = new Date(ev.at).getTime();
          return t > activeStartMs && t <= now.getTime();
        })
        .sort(
          (a, b) =>
            new Date(a.at).getTime() - new Date(b.at).getTime(),
        );

      if (activeWakes.length > 0) {
        // Split layout: start anchor + each wake + active continuation.
        events.push({
          id: `active-start-${active.id}`,
          kind: 'bedtime',
          status: 'real',
          sessionId: active.id,
          at: new Date(activeStartMs),
          segment: 'start',
        });

        for (const ev of activeWakes) {
          const t = new Date(ev.at).getTime();
          events.push({
            id: `care-${ev.id}`,
            kind: 'nightWake',
            status: 'real',
            careEventId: ev.id,
            at: new Date(ev.at),
            to: ev.endedAt ? new Date(ev.endedAt) : undefined,
            durationMs: ev.endedAt
              ? new Date(ev.endedAt).getTime() - t
              : undefined,
          });
          usedCareEventIds.add(ev.id);
        }

        const lastEnded = [...activeWakes]
          .reverse()
          .find((ev) => !!ev.endedAt);
        const resumeFromMs = lastEnded
          ? new Date(lastEnded.endedAt!).getTime()
          : activeStartMs;

        events.push({
          id: `active-${active.id}`,
          kind: 'bedtime',
          status: 'active',
          sessionId: active.id,
          from: new Date(resumeFromMs),
          segment: 'resumed',
        });
      } else {
        events.push({
          id: `active-${active.id}`,
          kind: 'bedtime',
          status: 'active',
          sessionId: active.id,
          from: new Date(active.startedAt),
        });
      }
    } else {
      events.push({
        id: `active-${active.id}`,
        kind: 'nap',
        status: 'active',
        sessionId: active.id,
        from: new Date(active.startedAt),
      });
    }
  }

  const months = ageInMonths(baby, now);
  const wakeWin = adjustedWakeWindow(wakeWindowForAge(months), dayNaps);
  const expectedNaps = expectedNapsForAge(months);
  const bedtime = bedtimeHintForAge(months);
  const bedtimeStart = floatToDate(dayStart, bedtime.earliest);
  const bedtimeEnd = floatToDate(dayStart, bedtime.latest);

  if (isToday) {
    // Anchor the prediction chain. If there's an active session we
    // project from its expected end (start + typical nap duration for a
    // nap, or skip predictions entirely for an active night). Otherwise
    // we anchor on the last completed event in the timeline so far.
    let anchorMs: number | null = null;
    let napsAccountedFor = dayNaps.length;
    if (active) {
      if (active.kind === 'nap') {
        const startMs = new Date(active.startedAt).getTime();
        anchorMs = startMs + TYPICAL_NAP_MS;
        napsAccountedFor += 1;
      }
      // Active night → no daytime predictions.
    } else if (events.length > 0) {
      const last = events[events.length - 1];
      const lastPoint = last.to ?? last.at ?? null;
      anchorMs = lastPoint ? lastPoint.getTime() : null;
    }

    if (anchorMs !== null) {
      const remaining = Math.max(0, expectedNaps - napsAccountedFor);
      let cursor = anchorMs;
      for (let i = 0; i < remaining; i++) {
        const fromMs = cursor + wakeWin.minMs;
        const toMs = cursor + wakeWin.maxMs;
        if (fromMs >= bedtimeStart.getTime()) break;
        events.push({
          id: `suggested-nap-${i}`,
          kind: 'nap',
          status: 'suggested',
          confidence: i === 0 ? 'high' : 'low',
          from: new Date(fromMs),
          to: new Date(toMs),
        });
        cursor = toMs + TYPICAL_NAP_MS;
      }
    }
  }

  if (nightStartedThatDay) {
    events.push({
      id: `bedtime-${nightStartedThatDay.id}`,
      kind: 'bedtime',
      status: 'real',
      sessionId: nightStartedThatDay.id,
      at: new Date(nightStartedThatDay.startedAt),
    });
  } else if (isToday && active?.kind !== 'night') {
    // The suggested bedtime sits at the tail of the prediction chain. If
    // there's already a real anchor today (no daytime suggestions in
    // between, e.g. last nap real and bedtime is the next event), it gets
    // high confidence; otherwise it inherits the chain's uncertainty.
    const hasSuggestedNapsBefore = events.some(
      (e) => e.kind === 'nap' && e.status === 'suggested',
    );
    events.push({
      id: 'bedtime',
      kind: 'bedtime',
      status: 'suggested',
      confidence: hasSuggestedNapsBefore ? 'low' : 'high',
      from: bedtimeStart,
      to: bedtimeEnd,
    });
  }

  for (const ev of careEvents) {
    if (ev.kind !== 'nightWake') continue;
    if (usedCareEventIds.has(ev.id)) continue;
    const t = new Date(ev.at).getTime();
    if (t >= dayStartMs && t < dayEndMs) {
      events.push({
        id: `care-${ev.id}`,
        kind: 'nightWake',
        status: 'real',
        careEventId: ev.id,
        at: new Date(ev.at),
        to: ev.endedAt ? new Date(ev.endedAt) : undefined,
        durationMs: ev.endedAt
          ? new Date(ev.endedAt).getTime() - t
          : undefined,
      });
    }
  }

  events.sort((a, b) => eventPosition(a) - eventPosition(b));

  // Insert tappable placeholders that prompt the parent to fill in the
  // missing pieces of the overnight chain.
  const hasOvernightBedtime = events.some(
    (e) =>
      e.kind === 'bedtime' &&
      e.status === 'real' &&
      e.overnightChain &&
      e.segment !== 'resumed',
  );
  const morningWakeIdx = events.findIndex(
    (e) =>
      e.kind === 'wake' &&
      e.status === 'real' &&
      !!e.careEventId &&
      !hasOvernightBedtime,
  );
  // Where to insert the addNightWake placeholder: right after the last
  // event that's still part of the overnight chain (last resumed bedtime
  // piece, or last real night-wake, or the prev-bedtime if neither),
  // and right before the closing morning wake.
  let closingWakeIdx = -1;
  let lastInNightIdx = -1;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e.overnightChain) continue;
    if (e.kind === 'wake' && e.status === 'real') {
      closingWakeIdx = i;
    } else if (e.status === 'real') {
      lastInNightIdx = i;
    }
  }

  const enriched: TimelineEvent[] = [];

  if (morningWakeIdx >= 0) {
    enriched.push({
      id: 'placeholder-add-bedtime',
      kind: 'bedtime',
      status: 'suggested',
      placeholder: 'addBedtime',
      overnightChain: true,
    });
  }

  const placeholderInsertIdx =
    hasOvernightBedtime && closingWakeIdx >= 0
      ? lastInNightIdx >= 0
        ? lastInNightIdx + 1
        : closingWakeIdx
      : -1;

  for (let i = 0; i < events.length; i++) {
    if (i === placeholderInsertIdx) {
      enriched.push({
        id: 'placeholder-add-night-wake',
        kind: 'nightWake',
        status: 'suggested',
        placeholder: 'addNightWake',
        overnightChain: true,
      });
    }
    enriched.push(events[i]);
  }

  return enriched;
}
