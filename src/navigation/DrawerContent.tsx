import React from 'react';
import { View } from 'react-native';

// The drawer panel is rendered with width=1 and is intentionally empty.
// The visible menu UI lives in <MenuPanel /> behind each scene; see
// DrawerSceneWrapper.tsx. We keep the React Navigation drawer purely
// for routing (state, openDrawer / closeDrawer, useDrawerProgress).
export const DrawerContent: React.FC = () => {
  return <View />;
};
