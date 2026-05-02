import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  ListRow,
  Text,
  Eyebrow,
} from '@/components';
import { spacing, screenGutter } from '@/theme';
import { useSleepStore } from '@/state/sleepStore';
import { useBabyStore } from '@/state/babyStore';
import { SleepSession } from '@/logic/recommendation';
import {
  formatClock,
  formatDuration,
  friendlyDateLabel,
  startOfDay,
} from '@/logic/format';
import { RootStackParamList } from '@/navigation/types';
import {
  LockedFeatureCard,
  canViewDate,
  useSubscription,
} from '@/subscription';

interface DaySection {
  dayStart: Date;
  title: string;
  data: SleepSession[];
  unlocked: boolean;
}

function groupByDay(
  sessions: SleepSession[],
  isUnlocked: (date: Date) => boolean,
  now: Date,
): DaySection[] {
  const completed = sessions
    .filter((s) => s.endedAt)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  const groups = new Map<number, SleepSession[]>();
  for (const s of completed) {
    const key = startOfDay(new Date(s.startedAt)).getTime();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([key, data]) => {
      const dayStart = new Date(key);
      return {
        dayStart,
        title: friendlyDateLabel(dayStart, now),
        data,
        unlocked: isUnlocked(dayStart),
      };
    });
}

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessions = useSleepStore((s) => s.sessions);
  const use24h = useBabyStore((s) => s.preferences.use24h);
  const { plan, openPaywall } = useSubscription();

  const now = useMemo(() => new Date(), []);
  const sections = useMemo(
    () => groupByDay(sessions, (d) => canViewDate(d, plan, now), now),
    [sessions, plan, now],
  );

  return (
    <Screen>
      <HeaderBar
        title="History"
        leading={{
          glyph: '‹',
          label: 'Back',
          onPress: () => navigation.goBack(),
        }}
      />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="headline" tone="secondary" align="center">
            No sleep logged yet.
          </Text>
          <Text
            variant="callout"
            tone="tertiary"
            align="center"
            style={styles.emptySub}
          >
            Start the first sleep from home.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <View key={section.dayStart.toISOString()} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Eyebrow>{section.title}</Eyebrow>
              </View>
              {section.unlocked ? (
                <Card padded={false} style={styles.card}>
                  {section.data.map((item, index) => {
                    const isLast = index === section.data.length - 1;
                    const start = new Date(item.startedAt);
                    const end = new Date(item.endedAt!);
                    const duration = end.getTime() - start.getTime();
                    return (
                      <ListRow
                        key={item.id}
                        label={item.kind === 'night' ? 'Night sleep' : 'Nap'}
                        value={formatDuration(duration)}
                        caption={`${formatClock(start, use24h)} → ${formatClock(end, use24h)}`}
                        showDivider={!isLast}
                        style={styles.row}
                      />
                    );
                  })}
                </Card>
              ) : (
                <LockedFeatureCard
                  title={section.title}
                  caption={`${section.data.length} ${section.data.length === 1 ? 'sueño registrado' : 'sueños registrados'}`}
                  onPress={() => openPaywall('fullHistory')}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  card: {
    marginBottom: 0,
  },
  row: {
    paddingHorizontal: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenGutter,
  },
  emptySub: {
    marginTop: spacing.md,
  },
});
