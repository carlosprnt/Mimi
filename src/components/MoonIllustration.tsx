import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface MoonIllustrationProps {
  size?: number;
}

export const MoonIllustration: React.FC<MoonIllustrationProps> = ({
  size = 160,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient
          id="moon-halo"
          cx="80"
          cy="80"
          rx="80"
          ry="80"
          fx="80"
          fy="80"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#A8A5E6" stopOpacity="0.32" />
          <Stop offset="0.5" stopColor="#A8A5E6" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#A8A5E6" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient
          id="moon-body"
          cx="60"
          cy="60"
          rx="78"
          ry="78"
          fx="60"
          fy="60"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.25" stopColor="#EDE9FF" />
          <Stop offset="0.55" stopColor="#B6B0EE" />
          <Stop offset="0.85" stopColor="#5C549E" />
          <Stop offset="1" stopColor="#2F2A66" />
        </RadialGradient>

        <RadialGradient
          id="moon-shadow"
          cx="118"
          cy="92"
          rx="78"
          ry="78"
          fx="118"
          fy="92"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#0B1436" stopOpacity="0.55" />
          <Stop offset="0.55" stopColor="#0B1436" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#0B1436" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient
          id="crater-1"
          cx="0"
          cy="0"
          rx="1"
          ry="1"
          fx="0.3"
          fy="0.3"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#1A1F4A" stopOpacity="0.32" />
          <Stop offset="0.6" stopColor="#1A1F4A" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.18" />
        </RadialGradient>
      </Defs>

      <Circle cx="80" cy="80" r="76" fill="url(#moon-halo)" />

      <G>
        <Circle cx="80" cy="80" r="50" fill="url(#moon-body)" />
        <Circle cx="80" cy="80" r="50" fill="url(#moon-shadow)" />

        <Path
          d="M 80 30 A 50 50 0 0 0 35 75 Q 41 51 56 41 Q 70 32 80 30 Z"
          fill="#FFFFFF"
          fillOpacity="0.18"
        />

        <Circle cx="62" cy="64" r="7.5" fill="url(#crater-1)" />
        <Circle cx="62" cy="64" r="3.6" fill="#1A1F4A" fillOpacity="0.18" />

        <Circle cx="92" cy="84" r="5.5" fill="url(#crater-1)" />
        <Circle cx="92" cy="84" r="2.6" fill="#1A1F4A" fillOpacity="0.18" />

        <Circle cx="73" cy="98" r="4.2" fill="url(#crater-1)" />
        <Circle cx="73" cy="98" r="2" fill="#1A1F4A" fillOpacity="0.18" />

        <Circle cx="100" cy="62" r="3.2" fill="url(#crater-1)" />
        <Circle cx="100" cy="62" r="1.4" fill="#1A1F4A" fillOpacity="0.18" />

        <Circle cx="54" cy="86" r="2.6" fill="url(#crater-1)" />
        <Circle cx="54" cy="86" r="1.2" fill="#1A1F4A" fillOpacity="0.18" />

        <Circle cx="68" cy="50" r="2.2" fill="#FFFFFF" fillOpacity="0.35" />
      </G>

      <Circle cx="22" cy="32" r="1.6" fill="#FFFFFF" fillOpacity="0.7" />
      <Circle cx="138" cy="44" r="1.3" fill="#FFFFFF" fillOpacity="0.55" />
      <Circle cx="128" cy="124" r="1.1" fill="#FFFFFF" fillOpacity="0.45" />
      <Circle cx="28" cy="128" r="1.7" fill="#FFFFFF" fillOpacity="0.6" />
      <Circle cx="146" cy="80" r="1" fill="#FFFFFF" fillOpacity="0.45" />
      <Circle cx="14" cy="86" r="1.2" fill="#FFFFFF" fillOpacity="0.5" />
    </Svg>
  );
};
