import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useMenuStore } from '@/state/menuStore';
import { useCelebrationStore } from '@/state/celebrationStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  Card,
  ListRow,
  Text,
  StickyAction,
  Sheet,
  BabyDropdown,
  Button,
  Timeline,
  TimelineEditSheet,
  type TimelineEditKind,
  DashboardHeader,
  DayCalendar,
  ActionMenu,
  type ActionMenuItem,
  EmptyDay,
  HomeHero,
  dayKey,
  PointEventSheet,
  SuggestionInfoSheet,
  TimeWheelView,
} from '@/components';
import { buildTimeline, TimelineEvent } from '@/logic/timeline';
import { CareEvent, CareEventKind } from '@/logic/careEvents';
import { makeId } from '@/utils/id';
import { colors, spacing, screenGutter } from '@/theme';
import { useActiveBaby, useBabyStore } from '@/state/babyStore';
import { useSessionsForBaby, useSleepStore } from '@/state/sleepStore';
import {
  useCareEventsForBaby,
  useCareEventStore,
} from '@/state/careEventStore';
import {
  activeSession,
  computeRecommendation,
  lastNightDurationForDay,
  lastWakeWindowMs,
  napsCountForDay,
  napsDurationForDay,
} from '@/logic/recommendation';
import {
  formatClock,
  formatDuration,
  isSameDay,
  startOfDay,
} from '@/logic/format';
import { softImpact, lightImpact } from '@/utils/haptics';
import { MainStackParamList } from '@/navigation/types';
import { t } from '@/i18n';
import type { Recommendation } from '@/logic/recommendation';

type IoniconName = keyof typeof Ionicons.glyphMap;

function heroIcon(rec: Recommendation): IoniconName {
  if (rec.root === 'SLEEPING') return rec.kind === 'night' ? 'moon' : 'bed';
  if (rec.root === 'NOW') return rec.kind === 'night' ? 'moon' : 'bed';
  return rec.kind === 'night' ? 'moon-outline' : 'bed-outline';
}

const TICK_MS = 30 * 1000;
const HEADER_EXPANDED = 72;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList, 'Home'>>();
  const insets = useSafeAreaInsets();
  const baby = useActiveBaby();
  const babies = useBabyStore((s) => s.babies);
  const setActiveBabyId = useBabyStore((s) => s.setActiveBabyId);
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const celebrationId = useCelebrationStore((s) => s.babyId);
  const [babySwitcherOpen, setBabySwitcherOpen] = useState(false);
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const careEvents = useCareEventsForBaby(baby?.id ?? null);
  const startSleep = useSleepStore((s) => s.startSleep);
  const endSleep = useSleepStore((s) => s.endSleep);
  const updateSession = useSleepStore((s) => s.updateSession);
  const addSession = useSleepStore((s) => s.addSession);
  const removeSession = useSleepStore((s) => s.removeSession);
  const addCareEvent = useCareEventStore((s) => s.addCareEvent);
  const updateCareEvent = useCareEventStore((s) => s.updateCareEvent);
  const removeCareEvent = useCareEventStore((s) => s.removeCareEvent);

  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [editing, setEditing] = useState<{
    kind: TimelineEditKind;
    sessionId: string | null;
    mode: 'edit' | 'addNap';
    start?: Date;
    end?: Date;
  } | null>(null);
  const [pointEvent, setPointEvent] = useState<{
    kind: CareEventKind;
    title: string;
    initial: Date;
    initialEnd?: Date;
    careEventId: string | null;
  } | null>(null);
  const [addBedtime, setAddBedtime] = useState<{
    wakeCareEventId: string | null;
    initial: Date;
  } | null>(null);
  const [suggestionInfo, setSuggestionInfo] = useState<TimelineEvent | null>(
    null,
  );
  const [hidePreviousNight, setHidePreviousNight] = useState(true);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const isToday = useMemo(() => isSameDay(selectedDate, now), [selectedDate, now]);

  const recommendation = useMemo(
    () =>
      baby && isToday
        ? computeRecommendation(baby, sessions, now, careEvents)
        : null,
    [baby, sessions, now, isToday, careEvents],
  );

  const active = useMemo(() => activeSession(sessions), [sessions]);
  const timeline = useMemo(
    () =>
      baby ? buildTimeline(baby, sessions, selectedDate, now, careEvents) : [],
    [baby, sessions, selectedDate, now, careEvents],
  );

  const daysWithData = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      set.add(dayKey(new Date(s.startedAt)));
      if (s.endedAt) set.add(dayKey(new Date(s.endedAt)));
    }
    for (const e of careEvents) {
      set.add(dayKey(new Date(e.at)));
    }
    return set;
  }, [sessions, careEvents]);

  if (!baby) return null;

  const onTarget =
    !!recommendation?.progress &&
    recommendation.progress.expectedMs > 0 &&
    recommendation.progress.elapsedMs >= recommendation.progress.expectedMs;
  const remainingLabel =
    recommendation?.progress && recommendation.progress.expectedMs > 0
      ? onTarget
        ? t('home.onTarget')
        : t('home.remainingDuration', {
            duration: formatDuration(
              recommendation.progress.expectedMs -
                recommendation.progress.elapsedMs,
            ),
          })
      : undefined;

  const lastNightMs = lastNightDurationForDay(sessions, selectedDate, now);
  const napMs = napsDurationForDay(sessions, selectedDate, now);
  const naps = napsCountForDay(sessions, selectedDate, now);
  const wakeMs = isToday ? lastWakeWindowMs(sessions, now) : null;

  const lastSleepForDay = useMemo(() => {
    const eligible = sessions.filter(
      (s) => s.endedAt && isSameDay(new Date(s.endedAt), selectedDate),
    );
    if (eligible.length === 0) return undefined;
    return eligible.reduce((a, b) =>
      new Date(a.endedAt!).getTime() > new Date(b.endedAt!).getTime() ? a : b,
    );
  }, [sessions, selectedDate]);

  const lastSleepDurationMs = lastSleepForDay
    ? new Date(lastSleepForDay.endedAt!).getTime() -
      new Date(lastSleepForDay.startedAt).getTime()
    : null;
  const lastSleepCaption = lastSleepForDay
    ? t('home.startedAt', {
        time: formatClock(new Date(lastSleepForDay.startedAt), use24h),
      })
    : undefined;

  const onPressAction = () => {
    if (active) {
      lightImpact();
      setConfirmEnd(true);
    } else {
      softImpact();
      startSleep(baby.id);
    }
  };

  const confirmEndSleep = () => {
    endSleep(baby.id);
    setConfirmEnd(false);
    softImpact();
  };

  const hasWakeEvent = timeline.some((e) => e.kind === 'wake');

  const onPressTimelineEvent = (event: TimelineEvent) => {
    if (event.status === 'suggested' && !event.placeholder) {
      setSuggestionInfo(event);
      return;
    }
    if (event.placeholder === 'addBedtime') {
      // Default: 21:00 of the day before the morning wake.
      const wake = timeline.find(
        (e) => e.kind === 'wake' && e.status === 'real' && !!e.careEventId,
      );
      const ref = wake?.at ?? new Date(now);
      const initial = new Date(ref);
      initial.setDate(initial.getDate() - 1);
      initial.setHours(21, 0, 0, 0);
      setAddBedtime({ wakeCareEventId: wake?.careEventId ?? null, initial });
      return;
    }
    if (event.placeholder === 'addNightWake') {
      setPointEvent({
        kind: 'nightWake',
        title: t('timeline.addNightWake'),
        initial: new Date(now),
        careEventId: null,
      });
      return;
    }
    if (event.status === 'active' && event.sessionId) {
      setEditing({
        kind: 'activeStart',
        sessionId: event.sessionId,
        mode: 'edit',
        start: event.from,
      });
    } else if (event.sessionId && event.kind === 'wake') {
      setEditing({
        kind: 'wake',
        sessionId: event.sessionId,
        mode: 'edit',
        end: event.at,
      });
    } else if (event.sessionId && event.kind === 'nap') {
      setEditing({
        kind: 'nap',
        sessionId: event.sessionId,
        mode: 'edit',
        start: event.from,
        end: event.to,
      });
    } else if (event.careEventId && event.at) {
      // The visual kind 'wake' on a careEventId actually represents a
      // morningWake CareEvent (logged without a night session).
      const careKind: CareEventKind =
        event.kind === 'wake' ? 'morningWake' : (event.kind as CareEventKind);
      const titleMap: Record<CareEventKind, string> = {
        feeding: t('timeline.editFeeding'),
        diaper: t('timeline.editDiaper'),
        nightWake: t('timeline.editNightWake'),
        morningWake: t('timeline.editMorningWake'),
      };
      setPointEvent({
        kind: careKind,
        title: titleMap[careKind],
        initial: event.at,
        initialEnd: event.to,
        careEventId: event.careEventId,
      });
    }
  };

  const onPressAddWake = () => {
    const defaultWake = new Date(selectedDate);
    defaultWake.setHours(7, 0, 0, 0);
    setPointEvent({
      kind: 'morningWake',
      title: t('timeline.editMorningWake'),
      initial: defaultWake,
      careEventId: null,
    });
  };

  const onPressAddNap = () => {
    const defaultStart = new Date(now);
    defaultStart.setHours(defaultStart.getHours() - 1, 0, 0, 0);
    const defaultEnd = new Date(now);
    defaultEnd.setMinutes(0, 0, 0);
    setEditing({
      kind: 'nap',
      sessionId: null,
      mode: 'addNap',
      start: defaultStart,
      end: defaultEnd,
    });
  };

  const onPressMore = () => setActionMenuOpen(true);

  const onPressActiveQuickAction = () => {
    // During a nap the lightning button still records a nightWake care
    // event under the hood (same data shape) but the modal title and
    // resulting timeline label read as plain "Añadir despertar".
    const isNapActive = active?.kind === 'nap';
    setPointEvent({
      kind: 'nightWake',
      title: isNapActive
        ? t('timeline.addWake')
        : t('timeline.addNightWake'),
      initial: new Date(now),
      careEventId: null,
    });
  };

  const openPointEvent = (kind: CareEventKind, title: string) => {
    setActionMenuOpen(false);
    setTimeout(() => {
      setPointEvent({ kind, title, initial: new Date(now), careEventId: null });
    }, 200);
  };

  const actionItems: ActionMenuItem[] = [
    {
      id: 'nap',
      label: t('timeline.addNap'),
      icon: 'bed-outline',
      onPress: () => {
        setActionMenuOpen(false);
        setTimeout(onPressAddNap, 200);
      },
    },
    {
      id: 'wake',
      label: t('timeline.addWake'),
      icon: 'sunny-outline',
      onPress: () => {
        setActionMenuOpen(false);
        setTimeout(onPressAddWake, 200);
      },
    },
    {
      id: 'nightWake',
      label: t('timeline.addNightWake'),
      icon: 'flash-outline',
      onPress: () => openPointEvent('nightWake', t('timeline.addNightWake')),
    },
  ];

  const onSavePointEvent = (time: Date, endTime?: Date) => {
    if (!pointEvent) return;
    const patch: Partial<CareEvent> = {
      at: time.toISOString(),
      endedAt: endTime ? endTime.toISOString() : undefined,
    };
    if (pointEvent.careEventId) {
      updateCareEvent(baby.id, pointEvent.careEventId, patch);
    } else {
      addCareEvent(baby.id, {
        id: makeId(),
        kind: pointEvent.kind,
        at: patch.at!,
        endedAt: patch.endedAt,
      });
    }
    setPointEvent(null);
  };

  const onDeletePointEvent = () => {
    if (!pointEvent?.careEventId) return;
    removeCareEvent(baby.id, pointEvent.careEventId);
    setPointEvent(null);
  };

  // Materialize the missing night session: from the chosen bedtime
  // up to the registered morning wake. The morningWake care event is
  // removed because it's now embedded in the session as endedAt.
  const onConfirmAddBedtime = (bedtime: Date) => {
    if (!addBedtime) return;
    const wake = careEvents.find(
      (e) =>
        e.kind === 'morningWake' && e.id === addBedtime.wakeCareEventId,
    );
    if (!wake) {
      setAddBedtime(null);
      return;
    }
    const wakeAt = new Date(wake.at);
    if (bedtime.getTime() >= wakeAt.getTime()) {
      // The picked bedtime would be after the wake — pull it back to
      // the previous evening (21:00) as a sane fallback.
      bedtime = new Date(wakeAt);
      bedtime.setDate(bedtime.getDate() - 1);
      bedtime.setHours(21, 0, 0, 0);
    }
    addSession(baby.id, {
      id: makeId(),
      startedAt: bedtime.toISOString(),
      endedAt: wakeAt.toISOString(),
      kind: 'night',
    });
    removeCareEvent(baby.id, wake.id);
    setAddBedtime(null);
  };

  const onDeleteEditing = () => {
    if (!editing?.sessionId) return;
    removeSession(baby.id, editing.sessionId);
    setEditing(null);
  };

  const onSaveEdit = (update: { startedAt?: string; endedAt?: string }) => {
    if (!editing) return;
    if (editing.sessionId) {
      updateSession(baby.id, editing.sessionId, update);
    } else if (editing.mode === 'addNap' && update.startedAt && update.endedAt) {
      addSession(baby.id, {
        id: makeId(),
        startedAt: update.startedAt,
        endedAt: update.endedAt,
        kind: 'nap',
      });
    }
    setEditing(null);
  };

  const scrollPaddingTop = insets.top + HEADER_EXPANDED + spacing.sm;

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <DashboardHeader
        name={baby.name}
        scrollY={scrollY}
        onPressMenu={() => useMenuStore.getState().setOpen(true)}
        menuLabel={t('nav.menu')}
        showBabyChevron={babies.length > 1}
        onPressName={() => setBabySwitcherOpen(true)}
        celebrate={!!baby && celebrationId === baby.id}
        status={
          isToday && recommendation && recommendation.root === 'SLEEPING'
            ? recommendation.eyebrow
            : undefined
        }
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: scrollPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarWrap}>
          <DayCalendar
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            now={now}
            daysWithData={daysWithData}
          />
        </View>

        {!isToday ? (
          <View style={styles.backTodayRow}>
            <Pressable
              onPress={() => setSelectedDate(startOfDay(now))}
              style={({ pressed }) => [
                styles.backTodayBtn,
                pressed && styles.backTodayPressed,
              ]}
            >
              <Text variant="footnote" tone="accent">
                {t('home.backToToday')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isToday && recommendation ? (
          <View style={styles.heroWrap}>
            <HomeHero
              recommendation={recommendation}
              iconName={heroIcon(recommendation)}
              remainingLabel={remainingLabel}
              onTarget={onTarget}
            />
          </View>
        ) : null}

        {!isToday && timeline.length === 0 ? (
          <EmptyDay />
        ) : (
          <>
            <Card variant="bordered" tone="night" style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text variant="eyebrow" tone="tertiary">
                  {t('home.plan')}
                </Text>
                {isToday ? (
                  <Pressable
                    onPress={() => setHidePreviousNight((v) => !v)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.addWakePressed}
                  >
                    <Text variant="footnote" tone="accent">
                      {hidePreviousNight
                        ? t('timeline.viewPreviousNight')
                        : t('timeline.hidePreviousNight')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {isToday && !hasWakeEvent && active?.kind !== 'night' ? (
                <Pressable
                  onPress={onPressAddWake}
                  style={({ pressed }) => [
                    styles.addWakeRow,
                    pressed && styles.addWakePressed,
                  ]}
                >
                  <View style={styles.addWakeIcon}>
                    <Ionicons name="sunny-outline" size={14} color={colors.accent.base} />
                  </View>
                  <Text variant="body" tone="accent">
                    {t('timeline.addWake')}
                  </Text>
                </Pressable>
              ) : null}
              <Timeline
                events={timeline}
                use24h={use24h}
                now={now}
                onPressEvent={onPressTimelineEvent}
                hidePreviousNight={isToday && hidePreviousNight}
              />
              {isToday && !hasWakeEvent && active?.kind === 'night' ? (
                <Pressable
                  onPress={onPressAddWake}
                  style={({ pressed }) => [
                    styles.addWakeRowBottom,
                    pressed && styles.addWakePressed,
                  ]}
                >
                  <View style={styles.addWakeIcon}>
                    <Ionicons name="sunny-outline" size={14} color={colors.accent.base} />
                  </View>
                  <Text variant="body" tone="accent">
                    {t('timeline.addWake')}
                  </Text>
                </Pressable>
              ) : null}
            </Card>

            <Card variant="bordered" tone="night" style={styles.todayCard}>
              <Text variant="eyebrow" tone="tertiary" style={styles.todayHeading}>
                {isToday ? t('home.today') : t('home.daySummary')}
              </Text>
              <ListRow
                label={t('home.lastNight')}
                value={lastNightMs !== null ? formatDuration(lastNightMs) : '—'}
              />
              <ListRow label={t('home.naps')} value={naps.toString()} />
              <ListRow
                label={t('home.napTime')}
                value={napMs > 0 ? formatDuration(napMs) : '—'}
              />
              <ListRow
                label={t('home.lastSleep')}
                value={
                  lastSleepDurationMs !== null
                    ? formatDuration(lastSleepDurationMs)
                    : '—'
                }
                caption={lastSleepCaption}
                showDivider={isToday}
              />
              {isToday ? (
                <ListRow
                  label={t('home.lastWakeWindow')}
                  value={wakeMs !== null ? formatDuration(wakeMs) : '—'}
                  showDivider={false}
                />
              ) : null}
            </Card>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {isToday ? (
        <StickyAction
          title={active ? t('home.endSleep') : t('home.startSleep')}
          onPress={onPressAction}
          variant={active ? 'destructive' : 'outline'}
          onPressMore={active ? onPressActiveQuickAction : onPressMore}
          moreLabel={
            active ? t('timeline.addNightWake') : t('home.moreActions')
          }
          moreIcon={active ? 'flash' : 'ellipsis-horizontal'}
        />
      ) : null}

      <Sheet visible={confirmEnd} onClose={() => setConfirmEnd(false)}>
        <Text variant="title" style={styles.sheetTitle}>
          {t('home.endConfirmTitle')}
        </Text>
        <Text variant="callout" tone="secondary" style={styles.sheetBody}>
          {t('home.endConfirmBody')}
        </Text>
        <View style={styles.sheetActions}>
          <Button title={t('common.confirm')} onPress={confirmEndSleep} />
          <View style={{ height: spacing.md }} />
          <Button
            title={t('common.notYet')}
            variant="dangerGhost"
            onPress={() => setConfirmEnd(false)}
          />
        </View>
      </Sheet>

      <TimelineEditSheet
        visible={editing !== null}
        kind={editing?.kind ?? 'wake'}
        initialStart={editing?.start}
        initialEnd={editing?.end}
        onClose={() => setEditing(null)}
        onSave={onSaveEdit}
        onDelete={
          editing?.mode === 'edit' && editing.sessionId
            ? onDeleteEditing
            : undefined
        }
      />

      <ActionMenu
        visible={actionMenuOpen}
        onClose={() => setActionMenuOpen(false)}
        items={actionItems}
      />

      <PointEventSheet
        visible={pointEvent !== null}
        title={pointEvent?.title ?? ''}
        initial={pointEvent?.initial ?? now}
        initialEnd={pointEvent?.initialEnd}
        withEnd={pointEvent?.kind === 'nightWake'}
        onClose={() => setPointEvent(null)}
        onSave={onSavePointEvent}
        onDelete={pointEvent?.careEventId ? onDeletePointEvent : undefined}
      />

      <Sheet
        visible={addBedtime !== null}
        onClose={() => setAddBedtime(null)}
        variant="frosted"
      >
        <Text variant="title" style={styles.sheetTitle}>
          {t('timeline.addBedtimeData')}
        </Text>
        {addBedtime ? (
          <TimeWheelView
            initial={addBedtime.initial}
            use24h={use24h}
            onClose={() => setAddBedtime(null)}
            onConfirm={onConfirmAddBedtime}
          />
        ) : null}
      </Sheet>

      <SuggestionInfoSheet
        visible={suggestionInfo !== null}
        event={suggestionInfo}
        baby={baby}
        use24h={use24h}
        now={now}
        onClose={() => setSuggestionInfo(null)}
      />

      <BabyDropdown
        visible={babySwitcherOpen}
        babies={babies}
        activeBabyId={baby?.id ?? null}
        nameTopY={insets.top + 17}
        onSelect={(id) => {
          setActiveBabyId(id);
          setBabySwitcherOpen(false);
        }}
        onClose={() => setBabySwitcherOpen(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: 120,
  },
  calendarWrap: {
    marginHorizontal: -screenGutter,
    marginBottom: spacing.sm,
  },
  backTodayRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(168, 165, 230, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 165, 230, 0.25)',
  },
  backTodayPressed: {
    opacity: 0.6,
  },
  heroWrap: {
    marginTop: spacing.base,
  },
  planCard: {
    marginTop: spacing.lg,
  },
  planEyebrow: {
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addWakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  addWakeRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  addWakePressed: {
    opacity: 0.6,
  },
  addWakeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  todayCard: {
    marginTop: spacing.lg,
  },
  todayHeading: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  bottomSpacer: {
    height: spacing.huge,
  },
  sheetTitle: {
    marginTop: spacing.sm,
  },
  sheetBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sheetActions: {
    marginTop: spacing.md,
  },
});
