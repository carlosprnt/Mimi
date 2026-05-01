import React from 'react';
import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, HeaderBar, Text } from '@/components';
import {
  getPrivacyDocument,
  getTermsDocument,
  type LegalDocument,
} from '@/i18n/legal';
import { screenGutter, spacing } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteShape =
  | RouteProp<RootStackParamList, 'LegalPrivacy'>
  | RouteProp<RootStackParamList, 'LegalTerms'>;

const EMAIL_RE = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;

/**
 * Renders one section's body with embedded `mailto:` links auto-
 * detected from any email address, so users can tap "hola@mimi.app"
 * to reach support.
 */
const SectionBody: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(EMAIL_RE);
  return (
    <Text variant="callout" tone="secondary" style={styles.body}>
      {parts.map((part, i) =>
        EMAIL_RE.test(part) ? (
          <Text
            key={i}
            tone="accent"
            onPress={() => Linking.openURL(`mailto:${part}`)}
          >
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
};

export const LegalDocumentScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteShape>();
  const isPrivacy = route.name === 'LegalPrivacy';
  const doc: LegalDocument = isPrivacy
    ? getPrivacyDocument()
    : getTermsDocument();

  return (
    <Screen backdrop="night">
      <HeaderBar
        title={doc.title}
        leading={{
          icon: 'arrow-back',
          label: t('common.back'),
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="footnote" tone="tertiary" style={styles.lastUpdated}>
          {doc.lastUpdated}
        </Text>
        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="headline" tone="primary" style={styles.heading}>
              {section.heading}
            </Text>
            <SectionBody text={section.body} />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  lastUpdated: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    marginBottom: spacing.sm,
  },
  body: {
    lineHeight: 22,
  },
});
