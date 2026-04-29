import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface OrbitShineProps {
  /** Children whose bounding box defines the orbit path. */
  children: React.ReactNode;
  /** Duration of one full revolution (ms). */
  duration?: number;
  /** Length of the bright segment as a fraction of the perimeter. */
  litRatio?: number;
  /** Stroke width of the shine. */
  strokeWidth?: number;
  /** Stroke color. */
  color?: string;
}

/**
 * Wraps `children` and overlays an SVG pill outline whose stroke has
 * a single short bright segment that travels around the perimeter on
 * a continuous loop — a "shine" orbiting the button.
 */
export const OrbitShine: React.FC<OrbitShineProps> = ({
  children,
  duration = 2400,
  litRatio = 0.18,
  strokeWidth = 1.2,
  color = 'rgba(255,255,255,0.38)',
}) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const offset = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (
      !size ||
      Math.abs(size.w - width) > 0.5 ||
      Math.abs(size.h - height) > 0.5
    ) {
      setSize({ w: width, h: height });
    }
  };

  // Pill-shape perimeter: two straight runs of (W - H) plus the
  // circumference of one full circle of diameter H.
  const perimeter = size
    ? 2 * Math.max(0, size.w - size.h) + Math.PI * size.h
    : 0;

  useEffect(() => {
    if (perimeter <= 0) return;
    offset.value = 0;
    offset.value = withRepeat(
      withTiming(perimeter, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [perimeter, duration, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -offset.value,
  }));

  const litLength = perimeter * litRatio;
  const dashArray = `${litLength},${Math.max(1, perimeter - litLength)}`;

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      {children}
      {size ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Svg width={size.w} height={size.h}>
            <AnimatedRect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={Math.max(0, size.w - strokeWidth)}
              height={Math.max(0, size.h - strokeWidth)}
              rx={Math.max(0, size.h / 2 - strokeWidth / 2)}
              ry={Math.max(0, size.h / 2 - strokeWidth / 2)}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={dashArray}
              animatedProps={animatedProps}
            />
          </Svg>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
