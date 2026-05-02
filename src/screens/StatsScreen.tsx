import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  HeaderBar,
  Card,
  Text,
  SectionLabel,
} from '@/components';
import { spacing, screenGutter, colors, radii } from '@/theme';
import { useSleepStore } from '@/state/sleepStore';
import { RootStackParamList } from '@/navigation/types';
import {
  STAT_DESCRIPTORS,
  averageNapsPerDay,
  averageTotalSleepMs,
  bucketByDay,
  longestSleepMs,
  streakWithSleepLogged,
} from '@/logic/stats';
import { formatDuration } from '@/logic/format';
import {
  LockedFeatureCard,
  canViewStatistic,
  useSubscription,
} from '@/subscription';

export const StatsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessions = useSleepStore((s) => s.sessions);
  const { plan, openPaywall } = useSubscription();

  const buckets = useMemo(() => bucketByDay(sessions, 7), [sessions]);
  const avgTotal = averageTotalSleepMs(buckets);
  const avgNaps = averageNapsPerDay(buckets);
  const longest = longestSleepMs(buckets);
  const streak = streakWithSleepLogged(buckets);

  const valueFor = (key: string): string => {
    if (key === 'totalSleepDaily') return avgTotal > 0 ? formatDuration(avgTotal) : '—';
    if (key === 'avgNapsDaily') return avgNaps > 0 ? avgNaps.toFixed(1) : '—';
    if (key === 'longestSleep') return longest > 0 ? formatDuration(longest) : '—';
    if (key === 'streak') return streak > 0 ? `${streak} d` : '—';
    return '—';
  };

  const captionFor = (key: string): string | undefined => {
    if (key === 'totalSleepDaily') return 'Promedio en los últimos 7 días';
    if (key === 'avgNapsDaily') return 'Promedio de siestas por día';
    if (key === 'longestSleep') return 'Sueño más largo registrado';
    if (key === 'streak') return 'Días seguidos con sueño registrado';
    return undefined;
  };

  return (
    <Screen>
      <HeaderBar
        title="Stats"
        leading={{
          glyph: '‹',
          label: 'Back',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="LAST 7 DAYS" />
        <View style={styles.grid}>
          {STAT_DESCRIPTORS.map((stat) => {
            const unlocked = canViewStatistic(stat.key, plan);
            if (!unlocked) {
              return (
                <LockedFeatureCard
                  key={stat.key}
                  title={stat.titleKey}
                  caption={captionFor(stat.key)}
                  onPress={() => openPaywall('fullStats')}
                />
              );
            }
            return (
              <Card key={stat.key} padded={false} style={styles.card}>
                <View style={styles.cardInner}>
                  <Text variant="eyebrow" tone="tertiary">
                    {stat.titleKey.toUpperCase()}
                  </Text>
                  <Text variant="display" tone="accent" tabular style={styles.value}>
                    {valueFor(stat.key)}
                  </Text>
                  {captionFor(stat.key) ? (
                    <Text variant="footnote" tone="tertiary" style={styles.caption}>
                      {captionFor(stat.key)}
                    </Text>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.huge,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.bg.elevated,
    marginBottom: spacing.md,
  },
  cardInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  value: {
    marginTop: spacing.sm,
  },
  caption: {
    marginTop: spacing.sm,
  },
});
