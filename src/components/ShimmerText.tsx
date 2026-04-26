import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text, type TextProps } from './Text';

interface ShimmerTextProps extends TextProps {
  duration?: number;
  shimmerOpacity?: number;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  duration = 3200,
  shimmerOpacity = 0.65,
  style,
  ...textProps
}) => {
  const progress = useSharedValue(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress, duration]);

  const stripeStyle = useAnimatedStyle(() => {
    const x = -width + progress.value * (2 * width);
    return { transform: [{ translateX: x }] };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    if (e.nativeEvent.layout.width !== width) {
      setWidth(e.nativeEvent.layout.width);
    }
  };

  return (
    <MaskedView
      maskElement={
        <Text {...textProps} style={style}>
          {children}
        </Text>
      }
    >
      <View onLayout={onLayout}>
        <Text {...textProps} style={style}>
          {children}
        </Text>
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.stripe, { width }, stripeStyle]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                `rgba(255,255,255,${shimmerOpacity})`,
                'rgba(255,255,255,0)',
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}
      </View>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
