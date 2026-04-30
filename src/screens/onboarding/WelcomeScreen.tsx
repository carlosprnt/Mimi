import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CommonActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  Text,
  Button,
  ShootingStars,
  OrbitShine,
} from '@/components';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { useAuthStore } from '@/state/authStore';
import { useBabyStore } from '@/state/babyStore';
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/services/auth';
import { listBabies } from '@/services/babies';
import { pushLocalToRemote } from '@/services/pushLocalToRemote';
import { haptics } from '@/logic/haptics';
import { colors, fonts, screenGutter, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { t } from '@/i18n';

// Distance the main scene lifts when the auth panel opens. Calibrated
// (with the 0.95 scale below) so the first auth button sits ~40px
// below the visual bottom of the lifted+scaled scene on a standard
// iPhone.
const SCENE_LIFT = 165;
const SCENE_SCALE = 0.95;
const AUTH_PANEL_HEIGHT = 220;
const ANIM_OPEN = 380;
const ANIM_CLOSE = 260;

const LOGIN_IMAGE = require('../../../assets/login-01.png');

export const WelcomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setDraft = useOnboardingDraft((s) => s.set);
  const startedAt = useOnboardingDraft((s) => s.startedAt);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const slide = useSharedValue(0);

  useEffect(() => {
    if (!startedAt) setDraft({ startedAt: new Date().toISOString() });
  }, [startedAt, setDraft]);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    slide.value = withTiming(authPanelOpen ? 1 : 0, {
      duration: authPanelOpen ? ANIM_OPEN : ANIM_CLOSE,
      easing: authPanelOpen
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
    });
  }, [authPanelOpen, slide]);

  const authedUser = useAuthStore((s) => s.user);
  const setBabies = useBabyStore((s) => s.setBabies);
  const isFocused = useIsFocused();

  // After OAuth (Google or Apple) finishes, the auth store flips to
  // signed-in. Decide where to go based on what already exists:
  //   1. Remote has babies → adopt them and jump to the dashboard.
  //   2. Remote empty + local has babies (the user was running as a
  //      guest) → push that local data up to bind it to the new
  //      account and jump to the dashboard.
  //   3. Brand new account, nothing local → hand off to onboarding.
  useEffect(() => {
    if (!isFocused || !authedUser) return;
    setAuthPanelOpen(false);
    (async () => {
      const remote = await listBabies(authedUser.id);
      if (remote.length > 0) {
        setBabies(remote);
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
        );
        return;
      }
      const localBabies = useBabyStore.getState().babies;
      if (localBabies.length > 0) {
        await pushLocalToRemote(authedUser.id);
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Root' }] }),
        );
        return;
      }
      navigation.navigate('OnboardingDob');
    })();
  }, [isFocused, authedUser, navigation, setBabies]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [0, -SCENE_LIFT],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          slide.value,
          [0, 1],
          [1, SCENE_SCALE],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const sceneOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Drag the lifted scene downwards (anywhere on it) to dismiss the
  // auth panel. activeOffsetY(15) lets short jitters pass through to
  // children (so taps still register) — only a deliberate vertical
  // pull beyond 15px takes over.
  const dismissGesture = Gesture.Pan()
    .enabled(authPanelOpen)
    .activeOffsetY(15)
    .failOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationY > 0) {
        runOnJS(setAuthPanelOpen)(false);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slide.value, [0, 0.5, 1], [0, 0.3, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          slide.value,
          [0, 1],
          [40, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const onApple = async () => {
    if (busy) return;
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.appleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        t('onboarding.welcome.googleAlertTitle'),
        result.message ?? t('onboarding.welcome.googleErrorFallback'),
      );
    }
  };

  const imageSize = Math.round(width * 0.5);

  return (
    <Screen backdrop="night" edges={['left', 'right']}>
      <ShootingStars intervalMs={3500} />

      {/* Auth panel sits behind the main scene at the bottom of the
          screen. When the user taps "Ya tengo cuenta" the scene lifts
          up to reveal it. */}
      <Animated.View
        pointerEvents={authPanelOpen ? 'auto' : 'none'}
        style={[
          styles.authPanel,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
          panelStyle,
        ]}
      >
        {appleAvailable ? (
          <Pressable
            onPress={() => {
              haptics.light();
              void onApple();
            }}
            style={({ pressed }) => [
              styles.authBtn,
              pressed && styles.authBtnPressed,
            ]}
          >
            <Ionicons name="logo-apple" size={20} color="#000000" />
            <Text style={styles.authBtnLabel}>
              {t('onboarding.summary.apple')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            haptics.light();
            void onGoogle();
          }}
          style={({ pressed }) => [
            styles.authBtn,
            pressed && styles.authBtnPressed,
          ]}
        >
          <Ionicons name="logo-google" size={20} color="#000000" />
          <Text style={styles.authBtnLabel}>
            {t('onboarding.summary.google')}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Main scene — lifts up when the auth panel opens. The wrapper
          adds a hairline border + scale-down + blurred overlay so the
          lifted screen reads as 'paused' while the auth options are
          revealed below. While the panel is open, tapping anywhere on
          the lifted scene OR dragging it down dismisses the panel. */}
      <GestureDetector gesture={dismissGesture}>
        <Animated.View style={[styles.scene, styles.sceneFrame, sceneStyle]}>
        <View style={[styles.body, { paddingTop: insets.top + spacing.xxl }]}>
          <View style={styles.imageWrap}>
            <Image
              source={LOGIN_IMAGE}
              style={{
                width: imageSize,
                height: imageSize,
              }}
              resizeMode="contain"
            />
          </View>

          <Text variant="title" align="center" style={styles.title}>
            {t('onboarding.welcome.title')}
          </Text>
          <Text
            variant="callout"
            tone="secondary"
            align="center"
            style={styles.subtitle}
          >
            {t('onboarding.welcome.subtitle')}
          </Text>
        </View>

        <View
          style={[
            styles.ctaWrap,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <OrbitShine>
            <Button
              title={t('onboarding.welcome.cta')}
              onPress={() => navigation.navigate('OnboardingDob')}
            />
          </OrbitShine>
          <View style={styles.ctaGap} />
          <Button
            title={t('onboarding.welcome.signIn')}
            variant="subtle"
            onPress={() => setAuthPanelOpen((open) => !open)}
            style={authPanelOpen ? styles.signInBtnDimmed : undefined}
          />
        </View>

        {/* Frosted overlay layered on top of the lifted scene. Only
            visible while the auth panel is open. Lives inside the
            Animated.View so it scales/translates together with the
            scene and gives a unified 'paused' feel. The Pressable
            captures taps anywhere on the lifted scene and closes the
            panel. */}
        <Animated.View
          pointerEvents={authPanelOpen ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, sceneOverlayStyle]}
        >
          <BlurView
            intensity={4}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            style={[StyleSheet.absoluteFillObject, styles.sceneTint]}
            pointerEvents="none"
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAuthPanelOpen(false)}
          />
        </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  sceneFrame: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sceneTint: {
    backgroundColor: 'rgba(7, 11, 31, 0.18)',
  },
  signInBtnDimmed: {
    opacity: 0.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: screenGutter,
    alignItems: 'center',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    paddingHorizontal: spacing.sm,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  ctaWrap: {
    paddingHorizontal: screenGutter,
    paddingTop: spacing.md,
  },
  ctaGap: {
    height: spacing.sm,
  },
  authPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: AUTH_PANEL_HEIGHT,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  authBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  authBtnPressed: {
    opacity: 0.85,
  },
  authBtnLabel: {
    color: '#0E0F12',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});
