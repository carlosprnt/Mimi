import React from 'react';
import { LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

interface ScrollScaleWrapProps {
  /** Live scroll offset of the parent ScrollView. */
  scrollY: SharedValue<number>;
  /** Pixels from the top of the screen occupied by the sticky header.
   *  Animation starts when the card's top crosses this line. */
  headerHeight: number;
  /** Final scale at the end of the animation. */
  minScale?: number;
  /** Wrapper style passthrough. */
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

/**
 * Wraps a child so it scales (1 → minScale) as the user scrolls it
 * under the sticky header. The animation begins when the card's top
 * touches the header bottom and finishes when the card has fully left
 * the viewport.
 */
export const ScrollScaleWrap: React.FC<ScrollScaleWrapProps> = ({
  scrollY,
  headerHeight,
  minScale = 0.95,
  style,
  children,
}) => {
  const cardY = useSharedValue<number>(-1);
  const cardH = useSharedValue<number>(0);

  const onLayout = (e: LayoutChangeEvent) => {
    cardY.value = e.nativeEvent.layout.y;
    cardH.value = e.nativeEvent.layout.height;
  };

  const animStyle = useAnimatedStyle(() => {
    if (cardY.value < 0 || cardH.value === 0) return {};
    const start = cardY.value - headerHeight;
    const end = cardY.value + cardH.value;
    const scale = interpolate(
      scrollY.value,
      [start, end],
      [1, minScale],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View onLayout={onLayout} style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
};
