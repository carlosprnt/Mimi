import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen,
  Card,
  ListRow,
  Text,
  StickyAction,
  Sheet,
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
} from '@/components';
import { buildTimeline, TimelineEvent } from '@/logic/timeline';
import { CareEventKind } from '@/logic/careEvents';
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
  lastCompletedSession,
  lastWakeWindowMs,
  napsCountForDay,
  totalSleepForDayMs,
} from '@/logic/recommendation';
import {
  formatClock,
  formatDuration,
  formatRelativePast,
  isSameDay,
  startOfDay,
} from '@/logic/format';
import { softImpact, lightImpact } from '@/utils/haptics';
import { DrawerParamList } from '@/navigation/types';
import { t } from '@/i18n';
import type { Recommendation, SleepSession } from '@/logic/recommendation';

type IoniconName = keyof typeof Ionicons.glyphMap;

function heroIcon(
  rec: Recommendation,
  active: SleepSession | undefined,
): IoniconName {
  if (rec.state === 'sleeping') {
    return active?.kind === 'night' ? 'moon' : 'bed';
  }
  if (rec.state === 'bedtime') return 'moon-outline';
  if (rec.state === 'overdue') return 'bed';
  return 'bed-outline';
}

const TICK_MS = 30 * 1000;
const HEADER_EXPANDED = 72;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Home'>>();
  const insets = useSafeAreaInsets();
  const baby = useActiveBaby();
  const use24h = useBabyStore((s) => s.preferences.use24h);
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
    mode: 'edit' | 'addNap' | 'addWake';
    start?: Date;
    end?: Date;
  } | null>(null);
  const [pointEvent, setPointEvent] = useState<{
    kind: CareEventKind;
    title: string;
    initial: Date;
    careEventId: string | null;
  } | null>(null);

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
    () => (baby && isToday ? computeRecommendation(baby, sessions, now) : null),
    [baby, sessions, now, isToday],
  );

  const active = useMemo(() => activeSession(sessions), [sessions]);
  const last = useMemo(() => lastCompletedSession(sessions), [sessions]);
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

  const remainingLabel =
    recommendation?.progress && recommendation.progress.expectedMs > 0
      ? recommendation.progress.elapsedMs >= recommendation.progress.expectedMs
        ? t('home.onTarget')
        : t('home.remainingDuration', {
            duration: formatDuration(
              recommendation.progress.expectedMs -
                recommendation.progress.elapsedMs,
            ),
          })
      : undefined;

  const totalMs = totalSleepForDayMs(sessions, selectedDate, now);
  const naps = napsCountForDay(sessions, selectedDate, now);
  const wakeMs = isToday ? lastWakeWindowMs(sessions, now) : null;

  const lastCaption =
    isToday && last
      ? `ended ${formatRelativePast(now.getTime() - new Date(last.endedAt!).getTime())}`
      : undefined;

  const lastValue =
    isToday && last
      ? formatDuration(
          new Date(last.endedAt!).getTime() - new Date(last.startedAt).getTime(),
        )
      : '—';

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
      const titleMap: Record<CareEventKind, string> = {
        feeding: t('timeline.editFeeding'),
        diaper: t('timeline.editDiaper'),
        nightWake: t('timeline.editNightWake'),
      };
      const kind = event.kind as CareEventKind;
      setPointEvent({
        kind,
        title: titleMap[kind],
        initial: event.at,
        careEventId: event.careEventId,
      });
    }
  };

  const onPressAddWake = () => {
    const defaultWake = new Date(selectedDate);
    defaultWake.setHours(7, 0, 0, 0);
    setEditing({
      kind: 'wake',
      sessionId: null,
      mode: 'addWake',
      end: defaultWake,
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

  const onSavePointEvent = (time: Date) => {
    if (!pointEvent) return;
    if (pointEvent.careEventId) {
      updateCareEvent(baby.id, pointEvent.careEventId, {
        at: time.toISOString(),
      });
    } else {
      addCareEvent(baby.id, {
        id: makeId(),
        kind: pointEvent.kind,
        at: time.toISOString(),
      });
    }
    setPointEvent(null);
  };

  const onDeletePointEvent = () => {
    if (!pointEvent?.careEventId) return;
    removeCareEvent(baby.id, pointEvent.careEventId);
    setPointEvent(null);
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
    } else if (editing.mode === 'addWake' && update.endedAt) {
      const endTime = new Date(update.endedAt);
      const startTime = new Date(endTime);
      startTime.setDate(startTime.getDate() - 1);
      startTime.setHours(22, 0, 0, 0);
      addSession(baby.id, {
        id: makeId(),
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        kind: 'night',
      });
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
        onPressMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        menuLabel={t('nav.menu')}
        status={
          isToday && recommendation && recommendation.state === 'sleeping'
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
              <Ionicons
                name="arrow-back"
                size={14}
                color={colors.accent.base}
              />
              <Text variant="footnote" tone="accent" style={styles.backTodayLabel}>
                {t('home.backToToday')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isToday && recommendation ? (
          <View style={styles.heroWrap}>
            <HomeHero
              recommendation={recommendation}
              iconName={heroIcon(recommendation, active)}
              remainingLabel={remainingLabel}
            />
          </View>
        ) : null}

        {!isToday && timeline.length === 0 ? (
          <EmptyDay />
        ) : (
          <>
            <Card variant="bordered" tone="night" style={styles.planCard}>
              <Text variant="eyebrow" tone="tertiary" style={styles.planHeading}>
                {t('home.plan')}
              </Text>
              {isToday && !hasWakeEvent ? (
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
              />
            </Card>

            <Card variant="bordered" tone="night" style={styles.todayCard}>
              <Text variant="eyebrow" tone="tertiary" style={styles.todayHeading}>
                {isToday ? t('home.today') : t('home.daySummary')}
              </Text>
              <ListRow
                label={t('home.totalSleep')}
                value={totalMs > 0 ? formatDuration(totalMs) : '—'}
              />
              <ListRow label={t('home.naps')} value={naps.toString()} />
              {isToday ? (
                <>
                  <ListRow
                    label={t('home.lastSleep')}
                    value={lastValue}
                    caption={lastCaption}
                  />
                  <ListRow
                    label={t('home.lastWakeWindow')}
                    value={wakeMs !== null ? formatDuration(wakeMs) : '—'}
                    showDivider={false}
                  />
                </>
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
          onPressMore={onPressMore}
          moreLabel={t('home.moreActions')}
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
            variant="ghost"
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
        onClose={() => setPointEvent(null)}
        onSave={onSavePointEvent}
        onDelete={pointEvent?.careEventId ? onDeletePointEvent : undefined}
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
  backTodayLabel: {
    marginLeft: 2,
  },
  heroWrap: {
    marginTop: spacing.base,
  },
  planCard: {
    marginTop: spacing.lg,
  },
  planHeading: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xxs,
  },
  addWakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
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
