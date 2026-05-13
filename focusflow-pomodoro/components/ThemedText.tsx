import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

type TypographyVariant = keyof typeof Typography;

interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function ThemedText({ variant = 'bodyMedium', color, style, children, ...props }: ThemedTextProps) {
  const textStyle = Typography[variant];
  const colors = useThemeColors();

  return (
    <Text
      style={[
        {
          fontFamily: textStyle.fontFamily,
          fontSize: textStyle.fontSize,
          letterSpacing: textStyle.letterSpacing,
          lineHeight: textStyle.lineHeight,
          color: color || colors.onSurface,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}