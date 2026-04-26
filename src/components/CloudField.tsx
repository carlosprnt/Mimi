import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

interface CloudShape {
  id: string;
  width: number;
  height: number;
  top: number;
  left: number;
  opacity: number;
  drift: number;
  duration: number;
  delay: number;
  tint: 'silver' | 'violet';
}

interface CloudProps extends CloudShape {}

const Cloud: React.FC<CloudProps> = ({
  id,
  width,
  height,
  top,
  left,
  opacity,
  drift,
  duration,
  delay,
  tint,
}) => {
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withDelay(
      delay,
      withRepeat(
        withTiming(drift, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [x, drift, duration, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const stopColor = tint === 'silver' ? '#E6E6F2' : '#A8A5E6';

  return (
    <Animated.View
      style={[
        styles.cloud,
        { top, left, width, height, opacity },
        animStyle,
      ]}
    >
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient
            id={`cloud-${id}`}
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            fx={width / 2}
            fy={height / 2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={stopColor} stopOpacity="0.55" />
            <Stop offset="0.45" stopColor={stopColor} stopOpacity="0.22" />
            <Stop offset="0.8" stopColor={stopColor} stopOpacity="0.05" />
            <Stop offset="1" stopColor={stopColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={`url(#cloud-${id})`}
        />
      </Svg>
    </Animated.View>
  );
};

export const CloudField: React.FC = () => {
  const { width, height } = useWindowDimensions();

  const clouds: CloudShape[] = [
    {
      id: 'c1',
      width: width * 1.4,
      height: 280,
      top: height - 320,
      left: -width * 0.2,
      opacity: 0.16,
      drift: 14,
      duration: 22000,
      delay: 0,
      tint: 'silver',
    },
    {
      id: 'c2',
      width: width * 1.1,
      height: 220,
      top: height - 220,
      left: width * 0.1,
      opacity: 0.22,
      drift: 22,
      duration: 28000,
      delay: 1500,
      tint: 'silver',
    },
    {
      id: 'c3',
      width: width * 0.85,
      height: 170,
      top: height - 150,
      left: -width * 0.15,
      opacity: 0.18,
      drift: 18,
      duration: 19000,
      delay: 3000,
      tint: 'violet',
    },
    {
      id: 'c4',
      width: width * 1.0,
      height: 200,
      top: height - 110,
      left: width * 0.05,
      opacity: 0.14,
      drift: 26,
      duration: 32000,
      delay: 800,
      tint: 'silver',
    },
    {
      id: 'c5',
      width: width * 0.7,
      height: 140,
      top: height - 70,
      left: width * 0.45,
      opacity: 0.12,
      drift: 12,
      duration: 24000,
      delay: 4500,
      tint: 'silver',
    },
  ];

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.field]}
    >
      {clouds.map((c) => (
        <Cloud key={c.id} {...c} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    overflow: 'hidden',
  },
  cloud: {
    position: 'absolute',
  },
});
