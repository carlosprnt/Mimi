import React from 'react';
import { Text, TextProps } from './Text';

export const Eyebrow: React.FC<TextProps> = (props) => (
  <Text variant="eyebrow" tone="tertiary" {...props} />
);
