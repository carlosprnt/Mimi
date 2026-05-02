import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { Button } from './Button';
import { spacing } from '@/theme';
import { TimelineEvent } from '@/logic/timeline';
import { ageInMonths, ageLabel, type Baby } from '@/logic/age';
import {
  wakeWindowForAge,
  bedtimeHintForAge,
  expectedNapsForAge,
} from '@/logic/recommendation';
import { formatClock } from '@/logic/format';
import { t } from '@/i18n';

interface SuggestionInfoSheetProps {
  visible: boolean;
  event: TimelineEvent | null;
  baby: Baby | null;
  use24h?: boolean;
  now?: Date;
  onClose: () => void;
}

const formatHourFloat = (h: number, use24h: boolean): string => {
  const date = new Date();
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  date.setHours(hours, minutes, 0, 0);
  return formatClock(date, use24h);
};

const buildBody = (
  event: TimelineEvent,
  baby: Baby,
  use24h: boolean,
  now: Date,
): { title: string; range: string | null; paragraph: string } => {
  const months = ageInMonths(baby, now);
  const age = ageLabel(baby, now);
  const name = baby.name;

  if (event.kind === 'nap') {
    const win = wakeWindowForAge(months);
    const minMin = Math.round(win.minMs / 60000);
    const maxMin = Math.round(win.maxMs / 60000);
    const expected = expectedNapsForAge(months);
    const range =
      event.from && event.to
        ? `${formatClock(event.from, use24h)} – ${formatClock(event.to, use24h)}`
        : null;
    const paragraph = t('suggestionInfo.napBody', {
      age,
      name,
      expected,
      minMin,
      maxMin,
    });
    return { title: t('timeline.nap'), range, paragraph };
  }

  if (event.kind === 'bedtime') {
    const bed = bedtimeHintForAge(months);
    const earliest = formatHourFloat(bed.earliest, use24h);
    const latest = formatHourFloat(bed.latest, use24h);
    const range =
      event.from && event.to
        ? `${formatClock(event.from, use24h)} – ${formatClock(event.to, use24h)}`
        : null;
    const paragraph = t('suggestionInfo.bedtimeBody', {
      earliest,
      latest,
    });
    return { title: t('timeline.bedtime'), range, paragraph };
  }

  return {
    title: '',
    range: null,
    paragraph: '',
  };
};

export const SuggestionInfoSheet: React.FC<SuggestionInfoSheetProps> = ({
  visible,
  event,
  baby,
  use24h = true,
  now = new Date(),
  onClose,
}) => {
  if (!event || !baby) {
    return (
      <Sheet visible={visible} onClose={onClose} variant="night">
        <View />
      </Sheet>
    );
  }
  const body = buildBody(event, baby, use24h, now);

  return (
    <Sheet visible={visible} onClose={onClose} variant="night">
      <Text variant="eyebrow" tone="tertiary" style={styles.eyebrow}>
        {t('timeline.suggestedEyebrow')}
      </Text>
      <Text variant="title" style={styles.title}>
        {body.title}
      </Text>
      {body.range ? (
        <Text variant="callout" tone="secondary" style={styles.range} tabular>
          {body.range}
        </Text>
      ) : null}
      <Text variant="callout" tone="secondary" style={styles.body}>
        {body.paragraph}
      </Text>
      <View style={styles.actions}>
        <Button title={t('common.confirm')} onPress={onClose} />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  eyebrow: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  range: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  body: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
