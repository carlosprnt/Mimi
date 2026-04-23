import React, { useMemo } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
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

interface Section {
  title: string;
  data: SleepSession[];
}

function groupByDay(sessions: SleepSession[]): Section[] {
  const completed = sessions
    .filter((s) => s.endedAt)
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  const groups = new Map<string, SleepSession[]>();
  for (const s of completed) {
    const key = startOfDay(new Date(s.startedAt)).toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return Array.from(groups.entries()).map(([key, data]) => ({
    title: friendlyDateLabel(new Date(key)),
    data,
  }));
}

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessions = useSleepStore((s) => s.sessions);
  const use24h = useBabyStore((s) => s.preferences.use24h);

  const sections = useMemo(() => groupByDay(sessions), [sessions]);

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
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Eyebrow>{section.title}</Eyebrow>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1;
            const start = new Date(item.startedAt);
            const end = new Date(item.endedAt!);
            const duration = end.getTime() - start.getTime();
            return (
              <Card padded={false} style={styles.card}>
                <ListRow
                  label={item.kind === 'night' ? 'Night sleep' : 'Nap'}
                  value={formatDuration(duration)}
                  caption={`${formatClock(start, use24h)} → ${formatClock(end, use24h)}`}
                  showDivider={!isLast}
                  style={styles.row}
                />
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  sectionHeader: {
    marginTop: spacing.xl,
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
