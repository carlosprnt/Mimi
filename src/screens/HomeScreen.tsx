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
  HeroCard,
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
} from '@/components';
import { buildTimeline, TimelineEvent } from '@/logic/timeline';
import { makeId } from '@/utils/id';
import { colors, spacing, screenGutter } from '@/theme';
import { useActiveBaby, useBabyStore } from '@/state/babyStore';
import { useSessionsForBaby, useSleepStore } from '@/state/sleepStore';
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

const TICK_MS = 30 * 1000;
const HEADER_EXPANDED = 72;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Home'>>();
  const insets = useSafeAreaInsets();
  const baby = useActiveBaby();
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const sessions = useSessionsForBaby(baby?.id ?? null);
  const startSleep = useSleepStore((s) => s.startSleep);
  const endSleep = useSleepStore((s) => s.endSleep);
  const updateSession = useSleepStore((s) => s.updateSession);
  const addSession = useSleepStore((s) => s.addSession);

  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [editing, setEditing] = useState<{
    kind: TimelineEditKind;
    sessionId: string | null;
    mode: 'edit' | 'addNap' | 'addWake';
    start?: Date;
    end?: Date;
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
    () => (baby ? buildTimeline(baby, sessions, selectedDate, now) : []),
    [baby, sessions, selectedDate, now],
  );

  if (!baby) return null;

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
    if (!event.sessionId) return;
    if (event.kind === 'wake') {
      setEditing({
        kind: 'wake',
        sessionId: event.sessionId,
        mode: 'edit',
        end: event.at,
      });
    } else if (event.kind === 'nap') {
      setEditing({
        kind: 'nap',
        sessionId: event.sessionId,
        mode: 'edit',
        start: event.from,
        end: event.to,
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
          />
        </View>

        {isToday && recommendation?.context ? (
          <View style={styles.insightBanner}>
            <Text
              variant="callout"
              tone={recommendation.contextTone === 'warn' ? 'warn' : 'secondary'}
            >
              {recommendation.context}
            </Text>
          </View>
        ) : null}

        {isToday && recommendation ? (
          <HeroCard
            eyebrow={recommendation.eyebrow}
            primary={recommendation.primary}
            supporting={recommendation.supporting}
            muted={recommendation.state === 'sleeping'}
          />
        ) : null}

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

        {isToday && active ? (
          <Text
            variant="footnote"
            tone="tertiary"
            align="center"
            style={styles.activeNote}
          >
            {t('home.startedAt', {
              time: formatClock(new Date(active.startedAt), use24h),
            })}
          </Text>
        ) : null}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {isToday ? (
        <StickyAction
          title={active ? t('home.endSleep') : t('home.startSleep')}
          onPress={onPressAction}
          variant={active ? 'subtle' : 'primary'}
          onPressMore={onPressAddNap}
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
    marginBottom: spacing.lg,
  },
  insightBanner: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(22, 35, 90, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.night.cardEdge,
  },
  planCard: {
    marginTop: spacing.xl,
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
    marginTop: spacing.xl,
  },
  todayHeading: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  activeNote: {
    marginTop: spacing.md,
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
