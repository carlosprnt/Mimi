import React from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, HeaderBar, HEADER_BAR_HEIGHT, Text } from '@/components';
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
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const isPrivacy = route.name === 'LegalPrivacy';
  const doc: LegalDocument = isPrivacy
    ? getPrivacyDocument()
    : getTermsDocument();

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <HeaderBar
        title={doc.title}
        leading={{
          icon: 'arrow-back',
          label: t('common.back'),
          onPress: () => navigation.goBack(),
        }}
        scrollY={scrollY}
      />
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + HEADER_BAR_HEIGHT + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
      </Animated.ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: screenGutter,
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
