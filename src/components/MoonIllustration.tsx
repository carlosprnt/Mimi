import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface MoonIllustrationProps {
  size?: number;
}

export const MoonIllustration: React.FC<MoonIllustrationProps> = ({
  size = 140,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient
          id="moon-halo"
          cx="70"
          cy="70"
          rx="70"
          ry="70"
          fx="70"
          fy="70"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#A8A5E6" stopOpacity="0.28" />
          <Stop offset="0.55" stopColor="#A8A5E6" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#A8A5E6" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient
          id="moon-body"
          cx="55"
          cy="55"
          rx="55"
          ry="55"
          fx="55"
          fy="55"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#F4F1FF" />
          <Stop offset="0.55" stopColor="#C5C0F2" />
          <Stop offset="1" stopColor="#7E78C9" />
        </RadialGradient>

        <RadialGradient
          id="moon-shadow"
          cx="92"
          cy="78"
          rx="55"
          ry="55"
          fx="92"
          fy="78"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#1A1F4A" stopOpacity="0.45" />
          <Stop offset="0.7" stopColor="#1A1F4A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Circle cx="70" cy="70" r="65" fill="url(#moon-halo)" />

      <G>
        <Circle cx="70" cy="70" r="44" fill="url(#moon-body)" />
        <Circle cx="70" cy="70" r="44" fill="url(#moon-shadow)" />

        <Circle cx="56" cy="58" r="6.5" fill="#1A1F4A" fillOpacity="0.18" />
        <Circle cx="56" cy="58" r="3.4" fill="#1A1F4A" fillOpacity="0.1" />

        <Circle cx="80" cy="74" r="4.8" fill="#1A1F4A" fillOpacity="0.15" />
        <Circle cx="64" cy="84" r="3.6" fill="#1A1F4A" fillOpacity="0.13" />
        <Circle cx="86" cy="56" r="2.6" fill="#1A1F4A" fillOpacity="0.12" />
        <Circle cx="48" cy="76" r="2.2" fill="#1A1F4A" fillOpacity="0.12" />

        <Circle cx="58" cy="50" r="2.4" fill="#FFFFFF" fillOpacity="0.25" />
      </G>

      <Circle cx="22" cy="32" r="1.4" fill="#FFFFFF" fillOpacity="0.7" />
      <Circle cx="116" cy="42" r="1.2" fill="#FFFFFF" fillOpacity="0.55" />
      <Circle cx="108" cy="106" r="1" fill="#FFFFFF" fillOpacity="0.45" />
      <Circle cx="28" cy="108" r="1.6" fill="#FFFFFF" fillOpacity="0.6" />
    </Svg>
  );
};
